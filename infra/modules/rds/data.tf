data "aws_ec2_managed_prefix_list" "vpn_access_prefix_list_cloudflare" {
  name = "internal.aviv.cloudflare.vpn.private"
}


locals {
  #   vpn_cidr_blocks            = [for entry in data.aws_ec2_managed_prefix_list.vpn_access_prefix_list.entries : entry.cidr]
  vpn_cidr_blocks_cloudflare = [for entry in data.aws_ec2_managed_prefix_list.vpn_access_prefix_list_cloudflare.entries : entry.cidr]
  #   account_id                 = data.aws_caller_identity.current.account_id
}


data "aws_vpc" "foundation_vpc" {
  filter {
    name   = "tag:Name"
    values = ["${var.aws_account_name}"]
  }
}
