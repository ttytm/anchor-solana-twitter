import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { program, user } from "../tests";

describe("status", () => {
	it("can set a status message with up to 50 characters", async () => {
		const [statusPDA, _] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode("status"), user.publicKey.toBuffer()],
			program.programId
		);

		try {
			await program.methods.createStatus("x".repeat(51))
				.accounts({ user: user.publicKey, status: statusPDA })
				.rpc();
		} catch (err) {
			assert.equal(err.error.errorCode.code, "TooLong");
		}

		await program.methods.createStatus("🎯 Focusing")
			.accounts({ user: user.publicKey, status: statusPDA })
			.rpc();
		assert.equal((await program.account.status.fetch(statusPDA)).message, "🎯 Focusing");

		await program.methods.updateStatus("🍾 Celebrating")
			.accounts({ user: user.publicKey, status: statusPDA })
			.rpc();
		assert.equal((await program.account.status.fetch(statusPDA)).message, "🍾 Celebrating");

	});

	it("can delete a status message", async () => {
		const [statusPDA, _] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode("status"), user.publicKey.toBuffer()],
			program.programId
		);

		await program.methods.deleteStatus()
			.accounts({ user: user.publicKey, status: statusPDA })
			.rpc();
		assert.ok((await program.account.status.fetchNullable(statusPDA)) === null);
	});
})
