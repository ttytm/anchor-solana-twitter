use crate::errors::ErrorCode;
use crate::state::dm::*;
use anchor_lang::prelude::*;

pub fn send_dm(ctx: Context<SendDm>, recipient: Pubkey, content: String) -> Result<()> {
	let dm = &mut ctx.accounts.dm;
	let user: &Signer = &ctx.accounts.user;
	let clock: Clock = Clock::get().unwrap();

	require!(content.chars().count() <= 280, ErrorCode::ContentTooLong);

	dm.user = *user.key;
	dm.recipient = recipient;
	dm.timestamp = clock.unix_timestamp;
	dm.content = content;
	dm.edited = false;

	Ok(())
}

pub fn update_dm(ctx: Context<UpdateDm>, new_content: String) -> Result<()> {
	let dm = &mut ctx.accounts.dm;

	require!(dm.content != new_content, ErrorCode::NothingChanged);
	require!(new_content.chars().count() <= 280, ErrorCode::ContentTooLong);
	require!(new_content.chars().count() > 0, ErrorCode::NoContent);

	dm.content = new_content;
	dm.edited = true;

	Ok(())
}
