use crate::errors::ErrorCode;
use crate::state::reaction::*;
use anchor_lang::prelude::*;

pub fn react(ctx: Context<React>, tweet: Pubkey, input_char: String, reaction_bump: u8) -> Result<()> {
	let reaction = &mut ctx.accounts.reaction;
	let reaction_char = validate_reaction(input_char.chars().nth(0).unwrap());

	require!(reaction_char != ReactionChar::Invalid, ErrorCode::ReactionUnallowedChars);

	reaction.user = *ctx.accounts.user.key;
	reaction.tweet = tweet;
	reaction.reaction_char = reaction_char;
	reaction.bump = reaction_bump;

	Ok(())
}

pub fn update_reaction(ctx: Context<UpdateReaction>, input_char: String) -> Result<()> {
	let reaction = &mut ctx.accounts.reaction;
	let reaction_char = validate_reaction(input_char.chars().nth(0).unwrap());

	require!(reaction.reaction_char != reaction_char, ErrorCode::NothingChanged);
	reaction.reaction_char = reaction_char;
	Ok(())
}

fn validate_reaction(reaction_char: char) -> ReactionChar {
	match reaction_char {
		'👍' => ReactionChar::ThumbsUp,
		'🎉' => ReactionChar::Party,
		'😆' => ReactionChar::Haha,
		'😲' => ReactionChar::Wow,
		'🚀' => ReactionChar::Rocket,
		'👀' => ReactionChar::Eyes,
		_ => ReactionChar::Invalid,
	}
}
