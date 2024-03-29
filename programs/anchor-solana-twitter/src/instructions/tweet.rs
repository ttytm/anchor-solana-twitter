use crate::errors::ErrorCode;
use crate::state::tweet::*;
use anchor_lang::prelude::*;

pub fn send_tweet(ctx: Context<SendTweet>, mut tag: String, content: String) -> Result<()> {
	let tweet = &mut ctx.accounts.tweet;
	let user: &Signer = &ctx.accounts.user;
	let clock: Clock = Clock::get().unwrap();

	require!(tag.chars().count() <= 50, ErrorCode::TooLong);
	require!(tag.chars().all(|c| c.is_alphanumeric() || c == '-'), ErrorCode::UnallowedChars);
	require!(content.chars().count() <= 280, ErrorCode::TooLong);
	require!(content.chars().count() > 0, ErrorCode::NoContent);

	if tag == "" {
		tag = "[untagged]".to_string()
	}

	tweet.user = *user.key;
	tweet.timestamp = clock.unix_timestamp;
	tweet.tag = tag.to_lowercase();
	tweet.content = content;

	Ok(())
}

pub fn update_tweet(ctx: Context<UpdateTweet>, new_tag: String, new_content: String) -> Result<()> {
	let tweet = &mut ctx.accounts.tweet;

	require!(tweet.tag != new_tag || tweet.content != new_content, ErrorCode::NothingChanged);
	require!(new_tag.chars().count() <= 50, ErrorCode::TooLong);
	require!(new_content.chars().count() <= 280, ErrorCode::TooLong);
	require!(new_content.chars().count() > 0, ErrorCode::NoContent);

	tweet.tag = new_tag;
	tweet.content = new_content;
	tweet.state = Some(TweetState::Edited);

	Ok(())
}

// Instead of deleting a tweet "completely" (as is done with the alias, for example), we change the tag to [deleted] 
// and remove the content so it's children(comments) who rely on the tweets publickey won't become error driven orphans
pub fn delete_tweet(ctx: Context<DeleteTweet>) -> Result<()> {
	let tweet = &mut ctx.accounts.tweet;

	tweet.tag = "[deleted]".to_string();
	tweet.content = "".to_string();
	tweet.state = Some(TweetState::Deleted);

	Ok(())
}
