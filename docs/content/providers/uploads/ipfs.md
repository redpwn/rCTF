# IPFS Upload Provider

The IPFS upload provider uploads challenge resources to an IPFS node. To use it, specify `uploads/ipfs` for the upload provider name.

There needs to be an IPFS node to upload files to and one or a cluster of gateways to serve those files. The default gateway is set to 'https://cloudflare-ipfs.com' which removes the need to host a gateway.
## Configuration Options

Option|Description|Default
-|-|-
`api`|The URL to connect to the IPFS node.|`http://localhost:5001`
`gateway`|The gateway that serves these files.|`https://cloudflare-ipfs.com`

## Deployment Notes

If deploying rctf with docker-compose, the easiest way to add a local node is to add the following service to the compose file. All frontend instances can share the same node because there is little load on it.
```
ipfs:
  image: ipfs/go-ipfs
  networks:
    - rctf
  volumes:
    - ./data/ipfs-staging:/export
    - ./data/ipfs-data:/data/ipfs
  ports:
    - 8082:4001 # ipfs peering port
```

If the gateway is being self-hosted on the same server, `<PORT>:8080` can be added to the IPFS node and requests can be forwarded to that.

## Configuration Example

```yaml
uploadProvider:
  name: 'uploads/ipfs'
  options:
    api: "http://ipfs:5001"
    gateway: "http://ipfs.myctf.example.com"
```
