use crate::errors::ErrorCode;
use crate::state::comment::*;
use anchor_lang::prelude::*;

pub fn send_comment(ctx: Context<SendComment>, tweet: Pubkey, content: String, parent: Option<Pubkey>) -> Result<()> {
	let comment = &mut ctx.accounts.comment;
	let user: &Signer = &ctx.accounts.user;
	let clock: Clock = Clock::get().unwrap();

	require!(content.chars().count() <= 280, ErrorCode::TooLong);

	comment.user = *user.key;
	comment.tweet = tweet;
	comment.parent = parent.unwrap_or(tweet);
	comment.timestamp = clock.unix_timestamp;
	comment.content = content;

	Ok(())
}

pub fn update_comment(ctx: Context<UpdateComment>, new_content: String) -> Result<()> {
	let comment = &mut ctx.accounts.comment;

	require!(comment.content != new_content, ErrorCode::NothingChanged);

	comment.content = new_content;
	comment.state = Some(CommentState::Edited);

	Ok(())
}

pub fn delete_comment(ctx: Context<DeleteComment>) -> Result<()> {
	let comment = &mut ctx.accounts.comment;

	comment.content = "".to_string();
	comment.state = Some(CommentState::Deleted);

	Ok(())
}
