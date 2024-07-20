import { GCPAccessToken } from "npm-gcp-token";
import { GCPUserInfo } from "npm-gcp-userinfo";

export async function handleRequest(request, env, context) {
  var origin = request.headers.get("Origin") || request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const cors_domains = await env.CORS_DOMAINS.split(",");
    var originAllowed = false;
    for (var d in cors_domains) {
      var regex = new RegExp(cors_domains[d]);
      if (regex.test(origin)) {
        originAllowed = true;
      }
    }
    if (!originAllowed) {
      return new Response(
        JSON.stringify({ message: "CORS Not supported -> " + origin }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        Connection: request.headers.get("Connection"),
      },
    });
  }

  var authHeader = "";
  if (
    request.headers.get("Authorization") != undefined ||
    request.headers.get("authorization") != undefined
  ) {
    if (
      request.headers.get("Authorization") != undefined &&
      request.headers.get("Authorization").startsWith("Bearer ")
    ) {
      authHeader = request.headers.get("Authorization").split(" ")[1];
    } else if (
      request.headers.get("authorization") != undefined &&
      request.headers.get("authorization").startsWith("Bearer ")
    ) {
      authHeader = request.headers.get("authorization").split(" ")[1];
    }
  } else {
    return new Response(
      JSON.stringify({ message: "Authorization header not found." }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const googleProfileUrl =
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" +
    authHeader;

  var response = await fetch(googleProfileUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  var accountResponse = JSON.parse(await response.text());
  if (accountResponse == undefined || accountResponse["id"] == undefined) {
    return new Response(
      JSON.stringify({ message: "Account not found / token invalid." }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  var request_headers = {};
  for (var entry of request.headers.entries()) {
    request_headers[entry[0]] = entry[1];
  }
  request_headers["X-Auth-User"]= accountResponse["id"];
  request_headers["X-Auth-Email"]= accountResponse["email"];
  request_headers["X-Auth-Name"]= accountResponse["name"];
  request_headers["X-Auth-Profile"]= accountResponse["picture"];
  request_headers["X-Auth-Provider"]= "google";

  var userinfo_token = new GCPAccessToken(
    env.GCP_USERINFO_CREDENTIALS
  ).getAccessToken(
    "https://www.googleapis.com/auth/admin.directory.group.readonly"
  );
  var userinfo_response = await GCPUserInfo.getUserInfo(
    (
      await userinfo_token
    ).access_token,
    accountResponse["id"],
    env.DOMAIN
  );

  if (userinfo_response) {
    // filter group data from response
    var groups_return = [];
    for (var obj of userinfo_response.groups) {
      groups_return.push({
        email: obj.email,
        description: obj.description
      });
    }
    request_headers["X-Auth-Groups"]= JSON.stringify(groups_return);
  }

  var req_url = new URL(request.url);
  if (!env[req_url.pathname.split("/")[1]]) {
    throw new Error(req_url.pathname.split("/")[1] + " not bound service");
  }

  var response = await env[req_url.pathname.split("/")[1]].fetch(
    new Request(request.url, {
      method: request.method,
      body: request.body,
      headers: request_headers,
    })
  );

  var response_headers = {};
  response_headers["Access-Control-Allow-Credentials"] = "true";
  response_headers["Access-Control-Allow-Origin"] = origin;
  response_headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, DELETE, PUT";
  response_headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
  response_headers["Content-Type"] = "application/json";
  response_headers["Connection"] = request.headers.get("Connection");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response_headers,
  });
}
