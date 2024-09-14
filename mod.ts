import type {
  ChatMember,
  Context,
  UpdateIntersection,
} from "jsr:@mtkruto/mtkruto@0.2";
import {
  ChatMemberStatus,
  ChatType,
  type Entry,
  MessageType,
  UpdateDispatcher,
  UpdateType,
} from "jsr:@tmetrik/core@0.0";
import type { MiddlewareFn, MiddlewareObj } from "./types.ts";

export interface TmetrikParams {
  threshold?: number;
  timeout?: number;
  log?: boolean;
}

export type T = Context & UpdateIntersection;

export class Tmetrik extends UpdateDispatcher implements MiddlewareObj<T> {
  middleware(): MiddlewareFn<T> {
    return (ctx, next) => {
      const entry = constructEntry(ctx);
      if (entry != null) {
        this.addEntry(entry);
      }
      if (this.thresholdReached) {
        return Promise.all([this.dispatch(), next()]);
      } else {
        return next();
      }
    };
  }
}
function constructEntry(ctx: T): Entry | null {
  if (!ctx.me) {
    return null;
  }

  let updateType: UpdateType | null;
  if (ctx.message) {
    updateType = UpdateType.Message;
  } else if (ctx.editedMessage) {
    updateType = UpdateType.MessageEdited;
  } else if (ctx.deletedMessages) {
    updateType = UpdateType.MessagesDeleted;
  } else if (ctx.callbackQuery) {
    updateType = UpdateType.CallbackQuery;
  } else if (ctx.inlineQuery) {
    updateType = UpdateType.InlineQuery;
  } else if (ctx.chosenInlineResult) {
    updateType = UpdateType.InlineResultChosen;
  } else if (ctx.joinRequest) {
    updateType = UpdateType.JoinRequest;
  } else if (ctx.chatMember) {
    updateType = UpdateType.ChatMember;
  } else if (ctx.myChatMember) {
    updateType = UpdateType.ChatMemberMy;
  } else if (ctx.messageReactionCount) {
    updateType = UpdateType.MessageReactionCount;
  } else if (ctx.messageReactions) {
    updateType = UpdateType.MessageReactions;
  } else {
    updateType = null;
  }
  if (updateType == null) {
    return null;
  }

  let chat;
  let fromType: ChatType | null = null;
  if (ctx.from) {
    fromType = ChatType.User;
    // deno-lint-ignore no-cond-assign
  } else if (chat = ctx.senderChat ?? ctx.chat) {
    if (chat.type == "supergroup" && chat.isForum) {
      fromType = ChatType.Forum;
    } else if (chat.type == "supergroup") {
      fromType = ChatType.Supergroup;
    } else if (chat.type == "channel") {
      fromType = ChatType.Channel;
    } else if (chat.type == "group") {
      fromType = ChatType.Group;
    }
  }
  if (fromType == null) {
    return null;
  }

  let chatType = ChatType.Unknown;
  if (ctx.chat) {
    if (ctx.chat.type == "supergroup" && ctx.chat.isForum) {
      chatType = ChatType.Forum;
    } else if (ctx.chat.type == "supergroup") {
      chatType = ChatType.Supergroup;
    } else if (ctx.chat.type == "channel") {
      chatType = ChatType.Channel;
    } else if (ctx.chat.type == "group") {
      chatType = ChatType.Group;
    } else if (ctx.chat.type == "private") {
      chatType = ChatType.User;
    }
  }

  let messageType = MessageType.Unsupported;
  if (ctx.msg) {
    if ("text" in ctx.msg && ctx.msg.text) {
      messageType = MessageType.Text;
    } else if ("linkPreview" in ctx.msg && ctx.msg.linkPreview) {
      messageType = MessageType.Link;
    } else if ("photo" in ctx.msg && ctx.msg.photo) {
      messageType = MessageType.Photo;
    } else if ("document" in ctx.msg && ctx.msg.document) {
      messageType = MessageType.Document;
    } else if ("video" in ctx.msg && ctx.msg.video) {
      messageType = MessageType.Video;
    } else if ("sticker" in ctx.msg && ctx.msg.sticker) {
      messageType = MessageType.Sticker;
    } else if ("animation" in ctx.msg && ctx.msg.animation) {
      messageType = MessageType.Animation;
    } else if ("voice" in ctx.msg && ctx.msg.voice) {
      messageType = MessageType.Voice;
    } else if ("audio" in ctx.msg && ctx.msg.audio) {
      messageType = MessageType.Audio;
    } else if ("dice" in ctx.msg && ctx.msg.dice) {
      messageType = MessageType.Dice;
    } else if ("video_note" in ctx.msg && ctx.msg.video_note) {
      messageType = MessageType.VideoNote;
    } else if ("contact" in ctx.msg && ctx.msg.contact) {
      messageType = MessageType.Contact;
    } else if ("game" in ctx.msg && ctx.msg.game) {
      messageType = MessageType.Game;
    } else if ("poll" in ctx.msg && ctx.msg.poll) {
      messageType = MessageType.Poll;
    } else if ("invoice" in ctx.msg && ctx.msg.invoice) {
      messageType = MessageType.Invoice;
    } else if ("venue" in ctx.msg && ctx.msg.venue) {
      messageType = MessageType.Venue;
    } else if ("location" in ctx.msg && ctx.msg.location) {
      messageType = MessageType.Location;
    } else if ("newChatMembers" in ctx.msg && ctx.msg.newChatMembers) {
      messageType = MessageType.NewChatMembers;
    } else if ("leftChatMember" in ctx.msg && ctx.msg.leftChatMember) {
      messageType = MessageType.LeftChatMember;
    } else if ("newChatTitle" in ctx.msg && ctx.msg.newChatTitle) {
      messageType = MessageType.NewChatTitle;
    } else if ("newChatPhoto" in ctx.msg && ctx.msg.newChatPhoto) {
      messageType = MessageType.NewChatPhoto;
    } else if ("deletedChatPhoto" in ctx.msg && ctx.msg.deletedChatPhoto) {
      messageType = MessageType.DeletedChatPhoto;
    } else if ("groupCreated" in ctx.msg && ctx.msg.groupCreated) {
      messageType = MessageType.GroupCreated;
    } else if ("supergroupCreated" in ctx.msg && ctx.msg.supergroupCreated) {
      messageType = MessageType.SupergroupCreated;
    } else if ("channelCreated" in ctx.msg && ctx.msg.channelCreated) {
      messageType = MessageType.ChannelCreated;
    } else if ("newAutoDeleteTime" in ctx.msg && ctx.msg.newAutoDeleteTime) {
      messageType = MessageType.AutoDeleteTimerChanged;
    } else if ("chatMigratedTo" in ctx.msg && ctx.msg.chatMigratedTo) {
      messageType = MessageType.ChatMigratedTo;
    } else if ("chatMigratedFrom" in ctx.msg && ctx.msg.chatMigratedFrom) {
      messageType = MessageType.ChatMigratedFrom;
    } else if ("pinnedMessage" in ctx.msg && ctx.msg.pinnedMessage) {
      messageType = MessageType.PinnedMessage;
    } else if ("userShared" in ctx.msg && ctx.msg.userShared) {
      messageType = MessageType.UserShared;
    } else if ("writeAccessAllowed" in ctx.msg && ctx.msg.writeAccessAllowed) {
      messageType = MessageType.WriteAccessAllowed;
    } else if ("forumTopicCreated" in ctx.msg && ctx.msg.forumTopicCreated) {
      messageType = MessageType.ForumTopicCreated;
    } else if ("forumTopicEdited" in ctx.msg && ctx.msg.forumTopicEdited) {
      messageType = MessageType.ForumTopicEdited;
    } else if ("forumTopicClosed" in ctx.msg && ctx.msg.forumTopicClosed) {
      messageType = MessageType.ForumTopicClosed;
    } else if ("forumTopicReopened" in ctx.msg && ctx.msg.forumTopicReopened) {
      messageType = MessageType.ForumTopicReopened;
    } else if ("videoChatScheduled" in ctx.msg && ctx.msg.videoChatScheduled) {
      messageType = MessageType.VideoChatScheduled;
    } else if ("videoChatStarted" in ctx.msg && ctx.msg.videoChatStarted) {
      messageType = MessageType.VideoChatStarted;
    } else if ("videoChatEnded" in ctx.msg && ctx.msg.videoChatEnded) {
      messageType = MessageType.VideoChatEnded;
    } else if ("giveaway" in ctx.msg && ctx.msg.giveaway) {
      messageType = MessageType.Giveaway;
    } else if ("successfulPayment" in ctx.msg && ctx.msg.successfulPayment) {
      messageType = MessageType.SuccessfulPayment;
    } else if ("refundedPayment" in ctx.msg && ctx.msg.refundedPayment) {
      messageType = MessageType.RefundedPayment;
    }
  }

  let forwardFrom: number | undefined;
  if (ctx.msg?.forwardFrom) {
    switch (ctx.msg.forwardFrom.type) {
      case "user":
        forwardFrom = ctx.msg.forwardFrom.user.id;
        break;
      case "channel":
      case "supergroup":
        forwardFrom = ctx.msg.forwardFrom.chat.id;
    }
  }

  let forwardName: string | undefined;
  if (ctx.msg?.forwardFrom) {
    const forwardFrom = ctx.msg.forwardFrom;
    switch (forwardFrom.type) {
      case "user": {
        const user = forwardFrom.user;
        forwardName = user.firstName;
        if (user.lastName) {
          forwardName += " ";
          forwardName += user.lastName;
          forwardName = forwardName.trim();
        }
        break;
      }
      case "channel":
      case "supergroup":
        forwardName = forwardFrom.chat.title;
        break;
      case "hidden":
        forwardName = forwardFrom.name;
    }
  }

  const timestamp = new Date();
  const type = updateType;
  const to = ctx.me.id;
  const from = ctx.from?.id || ctx.senderChat?.id || ctx.chat?.id;
  if (!from) {
    return null;
  }

  const from_bot = ctx.from?.isBot || false;
  const from_firstname = ctx.from?.firstName ?? "";
  const from_lastname = ctx.from?.lastName ?? "";
  const from_username = ctx.from?.username ??
    (ctx.senderChat && "username" in ctx.senderChat
      ? ctx.senderChat.username ?? ""
      : "");
  const from_languagecode = ctx.from?.languageCode ?? "";
  const from_premium = ctx.from?.isPremium || false;
  const from_type = fromType;
  const from_title = ctx.senderChat && "title" in ctx.senderChat
    ? ctx.senderChat.title
    : "";
  const from_businessconnection = ctx.businessConnectionId ?? "";
  const from_boostcount = ctx.msg?.senderBoostCount ?? 0;
  const from_signature = ctx.msg?.authorSignature ?? "";

  const to_bot = ctx.me?.isBot ?? false;
  const to_firstname = ctx.me?.firstName ?? "";
  const to_lastname = ctx.me?.lastName ?? "";
  const to_username = ctx.me?.username ?? "";

  const chat_id = ctx.chat?.id ?? 0;
  const chat_username = ctx.chat && "username" in ctx.chat
    ? ctx.chat.username ?? ""
    : "";
  const chat_title = ctx.chat && "title" in ctx.chat ? ctx.chat.title : "";
  const chat_firstname = ctx.chat && "firstName" in ctx.chat
    ? ctx.chat.firstName
    : "";
  const chat_lastname = ctx.chat && "lastName" in ctx.chat
    ? ctx.chat.lastName ?? ""
    : "";
  const chat_type = chatType;

  const message_type = messageType;
  const message_id = ctx.msg?.id ?? 0;
  const message_threadid = ctx.msg?.threadId ?? 0;
  const message_date = ctx.msg?.date ?? new Date();
  const message_topic = ctx.msg?.isTopicMessage ?? false;
  const message_automaticforward = ctx.msg?.isAutomaticForward ?? false;
  const message_effectid = ctx.msg?.effectId ?? "";
  const message_replytomessageid = ctx.msg?.replyToMessageId ?? 0;
  const message_quotetext = ctx.msg?.replyQuote?.text ?? "";

  const forward_date = ctx.msg?.forwardFrom?.date ?? new Date();
  const forward_from = forwardFrom ?? 0;
  const forward_messageid =
    ctx.msg?.forwardFrom && ctx.msg.forwardFrom.type == "channel"
      ? ctx.msg.forwardFrom.messageId
      : 0;
  const forward_signature = ctx.msg?.forwardFrom
    ? ctx.msg.forwardFrom.type == "channel"
      ? ctx.msg.forwardFrom.authorSignature ?? ""
      : ctx.msg.forwardFrom.type == "supergroup"
      ? ctx.msg.forwardFrom.title ?? ""
      : ""
    : "";
  const forward_bot = ctx.msg?.forwardFrom?.type == "user"
    ? ctx.msg.forwardFrom.user.isBot
    : false;
  const forward_name = forwardName ?? "";

  const message_text = ctx.msg
    ? ("text" in ctx.msg
      ? ctx.msg.text
      : "caption" in ctx.msg
      ? ctx.msg.caption ?? ""
      : "")
    : "";

  const message_url = ctx.msg && "linkPreview" in ctx.msg
    ? ctx.msg.linkPreview?.url ?? ""
    : "";

  const dice_emoji = ctx.msg && "dice" in ctx.msg ? ctx.msg.dice.emoji : "";
  const dice_value = ctx.msg && "dice" in ctx.msg ? ctx.msg.dice.value : 0;

  const callbackquery_id = ctx.callbackQuery?.id ?? "";
  const callbackquery_inlinemessageid = ctx.callbackQuery?.inlineMessageId ??
    "";
  const callbackquery_data = ctx.callbackQuery?.data ?? "";

  const inlinequery_id = ctx.inlineQuery?.id ?? "";
  const inlinequery_text = ctx.inlineQuery?.query ?? "";
  const inlinequery_offset = ctx.inlineQuery?.offset ?? "";

  const inlineresultchosen_id = ctx.chosenInlineResult?.resultId ?? "";
  const inlineresultchosen_query = ctx.chosenInlineResult?.query ?? "";
  const inlineresultchosen_inlinemessageid =
    ctx.chosenInlineResult?.inlineMessageId ?? "";

  const chatmember_id = ctx.chatMember?.newChatMember.user.id ?? 0;
  const chatmember_bot = ctx.chatMember?.newChatMember.user.isBot ?? false;
  const chatmember_firstname = ctx.chatMember?.newChatMember.user.firstName ??
    "";
  const chatmember_lastname = ctx.chatMember?.newChatMember.user.lastName ??
    "";
  const chatmember_username = ctx.chatMember?.newChatMember.user.username ??
    "";
  const chatmember_premium = ctx.chatMember?.newChatMember.user.isPremium ??
    false;
  const chatmember_oldstatus = getChatMemberStatus(
    ctx.chatMember?.oldChatMember,
  );
  const chatmember_newstatus = getChatMemberStatus(
    ctx.chatMember?.newChatMember,
  );

  const payload = JSON.stringify(ctx.toJSON());

  return {
    timestamp,
    type,
    to,
    from,
    from_bot,
    from_firstname,
    from_lastname,
    from_username,
    from_languagecode,
    from_premium,
    from_type,
    from_title,
    from_businessconnection,
    from_boostcount,
    from_signature,
    to_bot,
    to_firstname,
    to_lastname,
    to_username,
    chat_id,
    chat_username,
    chat_title,
    chat_firstname,
    chat_lastname,
    chat_type,
    message_type,
    message_id,
    message_threadid,
    message_date,
    message_topic,
    message_automaticforward,
    message_effectid,
    message_replytomessageid,
    message_quotetext,
    forward_date,
    forward_from,
    forward_messageid,
    forward_signature,
    forward_bot,
    forward_name,
    message_text,
    message_url,
    dice_emoji,
    dice_value,
    callbackquery_id,
    callbackquery_inlinemessageid,
    callbackquery_data,
    inlinequery_id,
    inlinequery_text,
    inlinequery_offset,
    inlineresultchosen_id,
    inlineresultchosen_query,
    inlineresultchosen_inlinemessageid,
    chatmember_id,
    chatmember_bot,
    chatmember_firstname,
    chatmember_lastname,
    chatmember_username,
    chatmember_premium,
    chatmember_oldstatus,
    chatmember_newstatus,
    payload,
  };
}

function getChatMemberStatus(chatMember: ChatMember | undefined) {
  switch (chatMember?.status) {
    case "creator":
      return ChatMemberStatus.Creator;
    case "administrator":
      return ChatMemberStatus.Administrator;
    case "member":
      return ChatMemberStatus.Member;
    case "restricted":
      return ChatMemberStatus.Restricted;
    case "left":
      return ChatMemberStatus.Left;
    case "banned":
      return ChatMemberStatus.Banned;
    default:
      return ChatMemberStatus.Unknown;
  }
}
