import * as assert from "assert";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { program, user } from "../tests";

describe("user alias", () => {
	it("can create and update a user alias", async () => {
		const [userAliasPDA, _] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode("user-alias"), user.publicKey.toBuffer()],
			program.programId
		);

		await program.methods.createUserAlias("Potatogirl")
			.accounts({ user: user.publicKey, userAlias: userAliasPDA })
			.rpc();
		assert.equal((await program.account.userAlias.fetch(userAliasPDA)).alias, "Potatogirl");

		await program.methods.updateUserAlias("Sasha")
			.accounts({ user: user.publicKey, userAlias: userAliasPDA })
			.rpc();
		assert.equal((await program.account.userAlias.fetch(userAliasPDA)).alias, "Sasha");

	});

	it("can delete a user alias", async () => {
		const [userAliasPDA, _] = await PublicKey.findProgramAddress(
			[anchor.utils.bytes.utf8.encode("user-alias"), user.publicKey.toBuffer()],
			program.programId
		);

		await program.methods.deleteUserAlias()
			.accounts({ user: user.publicKey, userAlias: userAliasPDA })
			.rpc();
		assert.ok((await program.account.userAlias.fetchNullable(userAliasPDA)) === null);
	});
})
