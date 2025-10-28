import { Connection, PublicKey } from "@solana/web3.js";

function normalizeInput(input: string): string {
  return input.trim().toLowerCase();
}

export async function resolveAddressOrDomain(
  input: string,
  connection: Connection
): Promise<PublicKey> {
  const raw = input.trim();
  const normalized = normalizeInput(raw);

  // 1) Try raw base58 address
  try {
    return new PublicKey(raw);
  } catch {}

  if (!normalized.includes(".")) {
    throw new Error("Invalid address or domain");
  }

  // 2) Try AllDomains (arbitrary TLDs like .superteam)
  try {
    const { TldParser } = await import("@onsol/tldparser");
    const parser = new TldParser(connection);
    const owner = await parser.getOwnerFromDomainTld(normalized);
    if (owner) {
      const ownerStr =
        typeof owner === "string"
          ? owner
          : (owner as PublicKey).toBase58?.() ?? String(owner);
      return new PublicKey(ownerStr);
    }
  } catch {}

  // 3) Fallback to Bonfida SNS (.sol domains)
  try {
    const sns: any = await import("@bonfida/spl-name-service");

    // For .sol domains, use the resolve function directly
    if (normalized.endsWith(".sol")) {
      try {
        const domainName = normalized.replace(/\.sol$/i, "");
        const owner = await sns.resolve(connection, domainName);
        if (owner) {
          return owner;
        }
      } catch (error) {
        console.warn("SNS resolve failed:", error);
      }
    }

    // Try SOL record for other domains
    try {
      const solRecord = await sns.getRecordV2(
        connection,
        normalized,
        sns.Record.SOL
      );
      const recordStr =
        typeof solRecord === "string"
          ? solRecord
          : solRecord?.data ?? solRecord?.value;
      if (recordStr) {
        return new PublicKey(recordStr);
      }
    } catch {}

    // Generic domain key approach
    let pubkey: PublicKey | undefined;
    
    // Try getDomainKey for .sol domains
    if (normalized.endsWith(".sol")) {
      try {
        const nameOnly = normalized.replace(/\.sol$/i, "");
        const domainKey = await sns.getDomainKey(nameOnly);
        pubkey = domainKey;
      } catch {}
    }

    if (!pubkey) {
      throw new Error("Failed to resolve domain");
    }

    // Get the registry state to find the owner
    const registry = await sns.NameRegistryState.retrieve(connection, pubkey);
    const owner = registry?.owner;
    if (!owner) {
      throw new Error("Failed to resolve domain owner");
    }
    
    return new PublicKey(owner);
  } catch (e) {
    console.error("Domain resolution error:", e);
    throw new Error(`Failed to resolve domain: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}
