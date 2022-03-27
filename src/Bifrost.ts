export type BifrostWalletMetadata = {
  apiVersion: string;
  icon: string;
  name: string;
  id: string;
}

export type BifrostPaginate = {
  page: number,
  limit: number,
};

export type BifrostWalletApi = {
  getUsedAddresses(paginate?: BifrostPaginate | undefined): Promise<string[]>;
  getUtxos(value?: string | undefined): Promise<string[] | undefined>;
  getCollateral(): Promise<string[] | undefined>;
  experimental: {
    getCollateral(): Promise<string[] | undefined>
  };
  signTx(tx: string, isPartialSign?: boolean): Promise<string>;
  submitTx(tx: string): Promise<string>;
  getRewardAddress(): Promise<string>;
  getRewardAddresses(): Promise<string[]>;
  signData(rewardAddrCborHex: string, message: string): Promise<string>;
}

export type BifrostWalletId = string | "nami" | "ccvault" | "flint";

export class Bifrost {
  static _cardano = () => (window as any).cardano;
  static _api?: BifrostWalletApi = undefined;
  static _currentWalletId: string | undefined = undefined;

  public static getWallets(): BifrostWalletMetadata[] {
    const result: BifrostWalletMetadata[] = [];
    const cardano = Bifrost._cardano;
    for (const i in cardano()) {
      const p = cardano()[i];
      if (p.apiVersion !== null && p.icon != null && p.name !== null) {
        result.push({
          apiVersion: p.apiVersion,
          icon: p.icon,
          name: p.name,
          id: i.toString()
        });
      }
    }
    return result;
  }

  public static async enableAsync(id: BifrostWalletId): Promise<boolean> {
    try {
      const result = await Bifrost._cardano()[id].enable();
      if (typeof result === "boolean") Bifrost._api = Bifrost._cardano();
      else Bifrost._api = result;
      Bifrost._currentWalletId = id;
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  public static async isEnabledAsync(id: BifrostWalletId): Promise<boolean> {
    return await Bifrost._cardano()[id].isEnabled();
  }

  public static async setWalletAsync(id: BifrostWalletId) {
    if (await this.isEnabledAsync(id)) {
      await Bifrost.enableAsync(id);
      Bifrost._currentWalletId = id;
    } else Bifrost._throwNoAPIError();
  }

  public static async signTxRawAsync(txCborHex: string, isPartialSign?: boolean): Promise<string | undefined> {
    if (Bifrost._api !== undefined)
      return await Bifrost._api.signTx(txCborHex, isPartialSign);
    else
      Bifrost._throwNoAPIError();
  }

  public static async submitTxRawAsync(txCborHex: string): Promise<string | undefined> {
    if (Bifrost._api !== undefined)
      return await Bifrost._api.submitTx(txCborHex);
    else
      Bifrost._throwNoAPIError();
  }

  public static async getUsedAddressesRawAsync(): Promise<string[] | undefined> {
    if (Bifrost._api !== undefined)
      return await Bifrost._api.getUsedAddresses();
    else
      Bifrost._throwNoAPIError();
  }

  public static async getUtxosRawAsync(valueCborHex?: string): Promise<string[] | undefined> {
    if (Bifrost._api !== undefined)
      return await Bifrost._api.getUtxos(valueCborHex);
    else
      Bifrost._throwNoAPIError();
  }

  public static async getCollateralRawAsync(): Promise<string[] | undefined> {
    if (Bifrost._api !== undefined)
      return Bifrost._api.getCollateral ? Bifrost._api.getCollateral() : await Bifrost._api.experimental.getCollateral();
    else
      Bifrost._throwNoAPIError();
  }

  public static async getRewardAddressAsync(): Promise<string | undefined> {
    if (Bifrost._api !== undefined) {
      return await Bifrost._api.getRewardAddress();
    }
    else
      Bifrost._throwNoAPIError();
  }

  public static async getRewardAddressesAsync(): Promise<string[] | undefined> {
    if (Bifrost._api !== undefined) {
      return await Bifrost._api.getRewardAddresses();
    }
    else
      Bifrost._throwNoAPIError();
  }

  public static async signDataRawAsync(addressCborHex: string, message: string) {
    if (Bifrost._api !== undefined) {
      if (Bifrost._currentWalletId === "nami")
        return await Bifrost._cardano().signData(addressCborHex, message);
      else
        return await Bifrost._api.signData(addressCborHex, message);
    }
    else
      Bifrost._throwNoAPIError();
  }

  private static _throwNoAPIError() {
    throw Error('No API available, is the wallet connection enabled?');
  }
}