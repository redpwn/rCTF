import { Provider } from '../../../uploads/provider' // eslint-disable-line @typescript-eslint/no-unused-vars
import { create, Options } from 'ipfs-http-client' // eslint-disable-line @typescript-eslint/no-unused-vars
import { IPFS } from 'ipfs-core-types' // eslint-disable-line @typescript-eslint/no-unused-vars

interface IPFSProviderOptions {
  api: string;
  gateway: string;
}

export default class IPFSProvider implements Provider {
  private ipfs: IPFS
  private gateway: string

  constructor (_options: Partial<IPFSProviderOptions>) {
    const options: Required<IPFSProviderOptions> = {
      api: _options.api || 'http://localhost:5001',
      gateway: _options.gateway || 'https://cloudflare-ipfs.com'
    }

    this.ipfs = create(options.api as Options)
    this.gateway = options.gateway
    void this.init()
  }

  private async init () {
    const { id } = await this.ipfs.id() // makes sure it's working alright early on
    console.log(`IPFS connected to ${id}`)
  }

  upload = async (data: Buffer, name: string): Promise<string> => {
    const { cid } = await this.ipfs.add(data)
    return this.toUrl(cid.toString(), name)
  }

  private toUrl (cid: string, name: string): string {
    return `${this.gateway}/ipfs/${cid}?filename=${encodeURIComponent(name)}`
  }

  async getUrl (cid: string, name: string): Promise<string | null> {
    const { local } = await this.ipfs.files.stat(cid)

    if (!local) { // was not added on this server, could be any random file on IPFS
      return null
    }

    return this.toUrl(cid, name)
  }
}
