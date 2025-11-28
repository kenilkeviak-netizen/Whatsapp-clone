import React, { useRef, useState } from "react";
import { format } from "date-fns";
import {
  FaCheck,
  FaCheckDouble,
  FaPlus,
  FaRegCopy,
  FaSmile,
} from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import EmojiPicker from "emoji-picker-react";
import useOutsideclick from "../../hooks/useOutsideclick";

const MessageBubble = ({
  message,
  theme,
  onReact,
  currentUser,
  deleteMessage,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const emojiRef = useRef(null);
  const reactionRef = useRef(null);
  const optionRef = useRef(null);

  const isUser = message?.sender?._id === currentUser?._id;

  /** WhatsApp bubble background color */
  const sentBg = theme === "dark" ? "bg-[#005c4b]" : "bg-[#d9fdd3]";
  const recvBg = theme === "dark" ? "bg-[#202c33]" : "bg-white";

  /** WhatsApp bubble shape */
  const bubbleShape = isUser
    ? "rounded-l-lg rounded-tr-lg"
    : "rounded-r-lg rounded-tl-lg";

  /** WhatsApp message alignment */
  const align = isUser ? "justify-end pr-4" : "justify-start pl-4";

  /** Small quick reactions */
  const quick = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowReactions(false);
    setShowEmojiPicker(false);
  };

  /** Close popups when clicked outside */
  useOutsideclick(emojiRef, () => showEmojiPicker && setShowEmojiPicker(false));
  useOutsideclick(reactionRef, () => showReactions && setShowReactions(false));
  useOutsideclick(optionRef, () => showOptions && setShowOptions(false));

  return (
    <div className={`w-full flex ${align} my-1`}>
      <div className="relative group max-w-[70%]">
        {/* Bubble */}
        <div
          className={`px-2 py-1.5 text-sm shadow-sm break-words ${bubbleShape} ${
            isUser ? sentBg : recvBg
          }`}
        >
          {/* TEXT */}
          {message.contentType === "text" && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* IMAGE */}
          {message.contentType === "image" && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                className="rounded-md mb-1 max-w-full"
                alt="media"
              />
              {message.content && <p>{message.content}</p>}
            </div>
          )}

          {message.contentType === "video" && (
            <div>
              <video
                src={message.imageOrVideoUrl}
                className="rounded-md mb-1 max-w-full"
                controls
                alt="media"
              />
              {message.content && <p>{message.content}</p>}
            </div>
          )}

          {/* TIME + TICK */}
          <div className="h-3 flex justify-end items-center gap-1 text-[8px] opacity-70 mt-1">
            {format(new Date(message.createdAt), "HH:mm")}

            {isUser && (
              <>
                {/* SENT */}
                {message.messageStatus === "send" && (
                  <FaCheck size={8} className="text-gray-500" />
                )}

                {/* DELIVERED */}
                {message.messageStatus === "delivered" && (
                  <FaCheckDouble size={8} className="text-gray-500" />
                )}

                {/* READ */}
                {message.messageStatus === "read" && (
                  <FaCheckDouble size={8} className="text-blue-500" />
                )}
              </>
            )}
          </div>
        </div>

        {/* 3 DOT MENU */}
        <button
          ref={optionRef}
          onClick={() => setShowOptions(!showOptions)}
          className={`absolute ${isUser ? "-right-6" : "-left-6"} top-1 
          opacity-0 group-hover:opacity-100 transition`}
        >
          <HiDotsVertical className="text-gray-500" />
        </button>

        {/* SMILE BUTTON (REACTION TRIGGER) */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`absolute ${isUser ? "-left-9" : "-right-9"} 
          top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
          bg-white p-1.5 rounded-full shadow`}
        >
          <FaSmile className="text-gray-700 text-[14px]" />
        </button>

        {/* QUICK REACTION POPUP */}
        {showReactions && (
          <div
            ref={reactionRef}
            className={`absolute ${isUser ? "right-0" : "left-0"} 
            -top-10 bg-[#202c33] text-white px-2 py-1 rounded-full
            flex gap-1 items-center shadow-lg`}
          >
            {quick.map((em, i) => (
              <button
                key={i}
                onClick={() => handleReact(em)}
                className="text-[14px] hover:scale-110 transition"
              >
                {em}
              </button>
            ))}

            <div className="w-[1px] h-4 bg-gray-500 mx-1" />

            <button onClick={() => setShowEmojiPicker(true)}>
              <FaPlus className="text-[12px]" />
            </button>
          </div>
        )}

        {/* FULL EMOJI PICKER */}
        {showEmojiPicker && (
          <div
            ref={emojiRef}
            className={`absolute ${isUser ? "right-0" : "left-0"} top-10 z-50`}
          >
            <EmojiPicker
              emojiStyle="native"
              onEmojiClick={(e) => handleReact(e.emoji)}
              theme={theme}
            />
          </div>
        )}

        {/* REACTION BADGES (SMALLER NOW) */}
        {message.reactions?.length > 0 && (
          <div
            className={`-mt-1.5 flex ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <div className="px-1 py-1 bg-gray-200 dark:bg-[#b3b4b4] rounded-full shadow flex gap-1">
              {message.reactions.map((r, i) => (
                <span key={i} className="text-[12px] leading-none">
                  {r.emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {showOptions && (
          <div
            ref={optionRef}
            className={`absolute top-8 
      ${isUser ? "right-1" : "left-1"} 
      z-50 w-36 rounded-xl shadow-lg py-1 text-sm ${
        theme === "dark" ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"
      }`}
          >
            <button
              onClick={() => {
                if (message.contentType === "text") {
                  navigator.clipboard.writeText(message.content);
                }
                setShowOptions(false);
              }}
              className="flex items-center w-full px-2 py-1 gap-3 rounded-lg"
            >
              <FaRegCopy size={14} />
              <span>Copy</span>
            </button>

            {isUser && (
              <button
                onClick={() => {
                  deleteMessage(message?._id);
                  setShowOptions(false);
                }}
                className="flex items-center w-full px-2 py-1 gap-3 rounded-lg text-red-600"
              >
                <FaRegCopy className="text-red-500" size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
