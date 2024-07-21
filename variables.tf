variable "cloudflare_account_id" {
  description = "Cloudflare account id"
  type        = string
  nullable = false
}

variable "domain" {
  description = "domain"
  type        = string
  nullable = false
}

variable "cloudflare_zone_id" {
  description = "cloudflare worker zone id"
  type        = string
  nullable = false
}

variable "cloudflare_token" {
  description = "cloudflare token"
  type        = string
  nullable = false
}

variable project_name {
  description = "project name"
  type        = string
  nullable = false
}

variable GCP_LOGGING_PROJECT_ID {
  description = "GCP logging project id"
  type        = string
  nullable = false
}

variable GCP_LOGGING_CREDENTIALS {
  description = "GCP logging credentials"
  type        = string
  nullable = false
}

variable GCP_BIGQUERY_PROJECT_ID {
  description = "GCP bigquery project id"
  type        = string
  nullable = false
}

variable GCP_BIGQUERY_CREDENTIALS {
  description = "GCP bigquery credentials"
  type        = string
  nullable = false
}

variable GCP_USERINFO_CREDENTIALS {
  description = "GCP UserInfo credentials"
  type = string
  nullable = false
}

variable GLOBAL_SHARED_SECRET {
  description = "Global shared secret"
  type = string
  nullable = false
}