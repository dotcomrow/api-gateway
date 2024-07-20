import { GCPLogger } from "npm-gcp-logging";
import { GCPAccessToken } from "npm-gcp-token";

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
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Identity",
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

  var req_url = new URL(request.url);
  if (!env[req_url.pathname.split("/")[1]]) {
    throw new Error(req_url.pathname.split("/")[1] + " not bound service");
  }

  var request_headers = request.headers;
  request_headers.set("X-Auth-User", accountResponse["id"]);
  request_headers.set("X-Auth-Email", accountResponse["email"]);
  request_headers.set("X-Auth-Name", accountResponse["name"]);
  request_headers.set("X-Auth-Profile", accountResponse["picture"]);
  request_headers.set("X-Auth-Provider", "google");
  request_headers.set("X-Auth-Groups", accountResponse["groups"]);

  return env[req_url.pathname.split("/")[1]].fetch(
    new Request(request.url, {
      method: request.method,
      body: request.body,
      headers: request_headers,
    })
  );
}
