import React, { useRef, useState } from "react";
import { format } from "date-fns";
import { FaCheck, FaCheckDouble } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";

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
  const messageRef = useRef(null);
  const optionRef = useRef(null);
  const reactionRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const isUserMessage = message.sender._id === currentUser?._id;

  const bubbleClass = isUserMessage ? `chat-end` : `chat-start`;

  const bubbleContentClass = isUserMessage
    ? `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
      }`
    : `chat-bubble md:max-w-[50%] min-w-[130px] ${
        theme === "dark" ? "bg-[#144d38] text-white" : "bg-[#d9fdd3] text-black"
      }`;

  const handleReact = (emoji) => {
    onReact(message._id, emoji);
    setShowEmojiPicker(false);
    setShowReactions(false);
  };

  if (message === 0) return;

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  return (
    <div className={`chat ${bubbleClass}`}>
      <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
        <div className="flex justify-center gap-2">
          {message.contentType === "text" && (
            <p className="mr-2">{message.content}</p>
          )}
          {message.contentType === "image" && (
            <div>
              <img
                src={message.imageOrVideoUrl}
                alt="images"
                className="rounded-lg max-w-xs"
              />
              <p className="mt-1">{message.content}</p>
            </div>
          )}
        </div>

        <div className="self-end flex items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2">
          <span>{format(new Date(message.createdAt), "HH:mm")}</span>

          {isUserMessage && (
            <>
              {message.messageStatus === "send" && <FaCheck size={12} />}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} />
              )}
              {message.messageStatus === "delivered" && (
                <FaCheckDouble size={12} className="text-blue-600" />
              )}
            </>
          )}
        </div>

        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            className={`p-1 rounded-full ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
            onClick={() => setShowOptions((prev) => !prev)}
          >
            <HiDotsVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;