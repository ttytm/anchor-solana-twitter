import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { program, user } from "../tests";

// Hardcode address(e.g., your  phantom wallet) to allow testing dms in frontend
const dmRecipient = new PublicKey("7aCWNQmgu5oi4W9kQBRRiuBkUMqCuj5xTA1DsT7vz8qa");

const sendDm = async (user: any, recipient: PublicKey, content: string) => {
	const dmKeypair = Keypair.generate();
	await program.methods.sendDm(recipient, content)
		.accounts({
			dm: dmKeypair.publicKey,
			user: user.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		})
		.signers(user instanceof (anchor.Wallet as any) ? [dmKeypair] : [user, dmKeypair])
		.rpc();

	const dm = await program.account.dm.fetch(dmKeypair.publicKey);
	return { publicKey: dmKeypair.publicKey, account: dm }
};

describe("direct messages", () => {
	it("can send and update dms", async () => {
		const dm = await sendDm(user, dmRecipient, "Hey what's up?");
		assert.equal((await program.account.dm.fetch(dm.publicKey)).recipient.toBase58(), dmRecipient.toBase58());

		await program.methods.updateDm("Yo, u there?")
			.accounts({ dm: dm.publicKey, user: user.publicKey })
			.rpc();
		const updatedDm = await program.account.dm.fetch(dm.publicKey);
		assert.equal(updatedDm.content, "Yo, u there?");
		assert.equal(updatedDm.edited, true);

	});

	it("can delete dms", async () => {
		const dm = await sendDm(user, dmRecipient, "Hello there 👋");
		assert.equal((await program.account.dm.fetch(dm.publicKey)).recipient.toBase58(), dmRecipient.toBase58());

		await program.methods.deleteDm()
			.accounts({ dm: dm.publicKey, user: user.publicKey })
			.rpc();
		assert.ok((await program.account.dm.fetchNullable(dm.publicKey)) === null);
	});

	it("can fetch and filter dms", async () => {
		const allDms = await program.account.dm.all([
			{ memcmp: { offset: 8, bytes: user.publicKey.toBase58() } }
		]);
		assert.equal(allDms.length, 1);
		assert.ok(allDms.every((dm) => dm.account.user.toBase58() === user.publicKey.toBase58()));

		const userDms = await program.account.dm.all([
			// offset: 8 Discriminator + 32 User public key
			{ memcmp: { offset: 8 + 32, bytes: dmRecipient.toBase58(), } },
		]);
		assert.equal(userDms.length, 1);
		assert.ok(userDms.every((dm) => dm.account.recipient.toBase58() == dmRecipient.toBase58()));
	});
})

