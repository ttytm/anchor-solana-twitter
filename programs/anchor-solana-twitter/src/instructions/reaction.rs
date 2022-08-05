use crate::errors::ErrorCode;
use crate::state::reaction::*;
use anchor_lang::prelude::*;

pub fn react(ctx: Context<React>, tweet: Pubkey, reaction_char: String, reaction_bump: u8) -> Result<()> {
	let reaction = &mut ctx.accounts.reaction;

	reaction.user = *ctx.accounts.user.key;
	reaction.tweet = tweet;
	reaction.reaction_char = reaction_char;
	reaction.bump = reaction_bump;

	Ok(())
}

pub fn update_reaction(ctx: Context<UpdateReaction>, new_reaction_char: String) -> Result<()> {
	let reaction = &mut ctx.accounts.reaction;
	require!(reaction.reaction_char != new_reaction_char, ErrorCode::NothingChanged);
	reaction.reaction_char = new_reaction_char;
	Ok(())
}
