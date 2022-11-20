import * as anchor from "@project-serum/anchor";
import { AnchorSolanaTwitter } from "../target/types/anchor_solana_twitter";

// import test modules
import tweets from "./tweets";
import comments from "./comments";
import votings from "./votings";
import dms from "./dms";
import alias from "./alias";
import status from "./status";
import reactions from "./reactions";

export const program: anchor.Program<AnchorSolanaTwitter> =
		anchor.workspace.AnchorSolanaTwitter,
	provider = anchor.AnchorProvider.local(),
	user = provider.wallet;

anchor.setProvider(provider);

describe("anchor-solana-twitter tests", () => {
	describe("tweets", () => tweets());
	describe("comments", () => comments());
	describe("votings", () => votings());
	describe("direct messages", () => dms());
	describe("user alias", () => alias());
	describe("status", () => status());
	describe("reactions", () => reactions());
});
