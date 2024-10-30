// api_gateway_prod_cache
resource "null_resource" "d1_api_gateway_cache_id" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = "${path.module}/scripts/get_d1_id.sh"
    environment = {
      d1_name               = "api-gateway_${var.environment}_cache"
      cloudflare_account_id = var.cloudflare_account_id
      cloudflare_token      = var.cloudflare_token
    }
  }
}

data "local_file" "load_api_gateway_cache_id" {
  filename   = "${path.module}/api-gateway_${var.environment}_cache"
  depends_on = [null_resource.d1_api_gateway_cache_id]
}
