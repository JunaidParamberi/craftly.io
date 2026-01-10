
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Hash, Send, Users, Shield, 
  Loader2,
  Search, MoreVertical,
  Briefcase, CreditCard,
  Paperclip, FileText,
  User, Smile, Download, ExternalLink,
  Trash2, File, Image, Video, FileCode, FileSpreadsheet, FileType, X, Maximize2, Link2, Share2, Pencil, History, Plus, Radio, Users as UsersIcon, ChevronLeft, ChevronRight, ChevronDown, Heart, Sparkles, Monitor
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { TeamMessage, UserProfile } from '../types.ts';
import { db, storage, auth } from '../services/firebase.ts';
import { notificationService } from '../services/notificationService.ts';
import { 
  collection, addDoc, query, where, 
  onSnapshot, serverTimestamp, doc, updateDoc, setDoc, deleteDoc, arrayUnion, getDoc, orderBy, limit, getDocs
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';

const CHANNELS = [
  { id: 'General', name: 'General', description: 'Organization-wide broadcast channel', icon: Hash },
];

// Comprehensive emoji list organized by categories
const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  'Gestures & Body': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  'Activities': ['🎮', '🕹️', '🎲', '🧩', '♟️', '🎯', '🎳', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️', '🪖', '💄', '💍', '💼'],
  'Objects': ['🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '📻', '📱', '📞', '☎️', '📟', '📠', '📺', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '✔️', '☑️', '🔘', '⚪', '⚫', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⬜', '⬛', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
};

// Emoji keyword mapping for search functionality
const EMOJI_KEYWORDS: Record<string, string[]> = {
  '😀': ['grinning', 'happy', 'smile', 'face', 'joy', 'laugh'],
  '😃': ['smiling', 'happy', 'open', 'mouth', 'eyes', 'joy'],
  '😄': ['smile', 'happy', 'open', 'mouth', 'smiling', 'eyes', 'laugh'],
  '😁': ['grinning', 'beaming', 'happy', 'smile', 'teeth', 'eyes'],
  '😆': ['grinning', 'squinting', 'happy', 'laugh', 'joy', 'funny'],
  '😅': ['grinning', 'sweat', 'happy', 'relief', 'nervous', 'smile'],
  '😂': ['laughing', 'tears', 'joy', 'happy', 'crying', 'funny'],
  '🤣': ['rolling', 'floor', 'laughing', 'rofl', 'funny', 'haha'],
  '😊': ['smiling', 'happy', 'eyes', 'blush', 'pleased', 'joy'],
  '😇': ['smiling', 'halo', 'innocent', 'angel', 'good', 'heaven'],
  '🙂': ['slightly', 'smiling', 'face', 'happy', 'mild', 'content'],
  '🙃': ['upside', 'down', 'face', 'silly', 'flip', 'fun'],
  '😉': ['winking', 'face', 'wink', 'flirt', 'playful', 'fun'],
  '😌': ['relieved', 'face', 'calm', 'peaceful', 'relaxed', 'content'],
  '😍': ['heart', 'eyes', 'love', 'adore', 'attraction', 'crush'],
  '🥰': ['smiling', 'hearts', 'love', 'affection', 'adorable', 'crush'],
  '😘': ['kissing', 'heart', 'love', 'kiss', 'romance', 'affection'],
  '😗': ['kissing', 'face', 'kiss', 'love', 'affection', 'romance'],
  '😙': ['kissing', 'smiling', 'eyes', 'kiss', 'love', 'affection'],
  '😚': ['kissing', 'closed', 'eyes', 'kiss', 'love', 'affection'],
  '😋': ['yum', 'delicious', 'tasty', 'tongue', 'lick', 'food'],
  '😛': ['tongue', 'face', 'silly', 'playful', 'funny', 'joke'],
  '😝': ['squinting', 'tongue', 'silly', 'crazy', 'funny', 'joke'],
  '😜': ['winking', 'tongue', 'silly', 'playful', 'funny', 'joke'],
  '🤪': ['zany', 'face', 'crazy', 'silly', 'funny', 'wild'],
  '🤨': ['raised', 'eyebrow', 'skeptical', 'suspicious', 'question', 'doubt'],
  '🧐': ['monocle', 'face', 'thinking', 'smart', 'intelligent', 'detective'],
  '🤓': ['nerd', 'face', 'glasses', 'smart', 'geek', 'nerdy'],
  '😎': ['smiling', 'sunglasses', 'cool', 'awesome', 'swag', 'hip'],
  '🤩': ['star', 'struck', 'amazed', 'excited', 'wow', 'impressed'],
  '🥳': ['partying', 'face', 'party', 'celebration', 'birthday', 'fun'],
  '😏': ['smirking', 'face', 'smug', 'sly', 'sarcastic', 'confident'],
  '😒': ['unamused', 'face', 'unhappy', 'disappointed', 'bored', 'sad'],
  '😞': ['disappointed', 'face', 'sad', 'unhappy', 'down', 'depressed'],
  '😔': ['pensive', 'face', 'sad', 'thoughtful', 'worried', 'down'],
  '😟': ['worried', 'face', 'concerned', 'anxious', 'nervous', 'fear'],
  '😕': ['slightly', 'frowning', 'face', 'sad', 'unhappy', 'disappointed'],
  '🙁': ['frowning', 'face', 'sad', 'unhappy', 'disappointed', 'down'],
  '☹️': ['frowning', 'face', 'sad', 'unhappy', 'down', 'depressed'],
  '😣': ['persevering', 'face', 'struggle', 'determined', 'tired', 'exhausted'],
  '😖': ['confounded', 'face', 'confused', 'frustrated', 'upset', 'angry'],
  '😫': ['tired', 'face', 'exhausted', 'sleepy', 'weary', 'drained'],
  '😩': ['weary', 'face', 'tired', 'exhausted', 'frustrated', 'upset'],
  '🥺': ['pleading', 'face', 'puppy', 'eyes', 'sad', 'begging', 'cute'],
  '😢': ['crying', 'face', 'sad', 'tears', 'upset', 'weep'],
  '😭': ['loudly', 'crying', 'face', 'sobbing', 'tears', 'sad', 'upset'],
  '😤': ['huffing', 'face', 'proud', 'steam', 'angry', 'frustrated'],
  '😠': ['angry', 'face', 'mad', 'furious', 'annoyed', 'upset'],
  '😡': ['pouting', 'face', 'angry', 'furious', 'mad', 'enraged'],
  '🤬': ['cursing', 'face', 'swearing', 'angry', 'mad', 'furious'],
  '🤯': ['exploding', 'head', 'mind', 'blown', 'shocked', 'amazed'],
  '😳': ['flushed', 'face', 'embarrassed', 'blush', 'shy', 'awkward'],
  '🥵': ['hot', 'face', 'sweat', 'heat', 'fever', 'warm'],
  '🥶': ['cold', 'face', 'freezing', 'ice', 'chill', 'frozen'],
  '😱': ['screaming', 'fear', 'face', 'shocked', 'horror', 'scared'],
  '😨': ['fearful', 'face', 'scared', 'afraid', 'worried', 'anxious'],
  '😰': ['anxious', 'sweat', 'face', 'nervous', 'worried', 'fear'],
  '😥': ['sad', 'relieved', 'face', 'disappointed', 'worried', 'sad'],
  '😓': ['downcast', 'sweat', 'face', 'tired', 'exhausted', 'worried'],
  '🤗': ['hugging', 'face', 'hug', 'embrace', 'love', 'comfort'],
  '🤔': ['thinking', 'face', 'think', 'consider', 'ponder', 'thought'],
  '🤭': ['hand', 'over', 'mouth', 'shh', 'secret', 'quiet'],
  '🤫': ['shushing', 'face', 'quiet', 'shh', 'secret', 'silence'],
  '🤥': ['lying', 'face', 'lie', 'dishonest', 'pinocchio', 'untruth'],
  '😶': ['neutral', 'face', 'expressionless', 'blank', 'emotionless', 'nothing'],
  '😐': ['neutral', 'face', 'indifferent', 'expressionless', 'blank'],
  '😑': ['expressionless', 'face', 'blank', 'indifferent', 'emotionless'],
  '😬': ['grimacing', 'face', 'awkward', 'uncomfortable', 'cringe', 'nervous'],
  '🙄': ['rolling', 'eyes', 'face', 'sarcastic', 'unimpressed', 'annoyed'],
  '😯': ['hushed', 'face', 'surprised', 'shocked', 'quiet', 'amazed'],
  '😦': ['frowning', 'open', 'mouth', 'face', 'sad', 'disappointed'],
  '😧': ['anguished', 'face', 'sad', 'pain', 'distress', 'upset'],
  '😮': ['open', 'mouth', 'face', 'surprised', 'shocked', 'amazed'],
  '😲': ['astonished', 'face', 'surprised', 'shocked', 'amazed', 'wow'],
  '🥱': ['yawning', 'face', 'tired', 'sleepy', 'bored', 'exhausted'],
  '😴': ['sleeping', 'face', 'tired', 'sleep', 'zzz', 'rest'],
  '🤤': ['drooling', 'face', 'hungry', 'desire', 'food', 'want'],
  '😪': ['sleepy', 'face', 'tired', 'sleep', 'exhausted', 'weary'],
  '😵': ['dizzy', 'face', 'confused', 'dazed', 'spinning', 'sick'],
  '🤐': ['zipper', 'mouth', 'face', 'quiet', 'secret', 'sealed'],
  '🥴': ['woozy', 'face', 'dizzy', 'confused', 'drunk', 'sick'],
  '🤢': ['nauseated', 'face', 'sick', 'vomit', 'nausea', 'ill'],
  '🤮': ['vomiting', 'face', 'sick', 'puke', 'throw', 'up', 'ill'],
  '🤧': ['sneezing', 'face', 'sick', 'cold', 'flu', 'allergy'],
  '😷': ['face', 'with', 'medical', 'mask', 'sick', 'ill', 'mask'],
  '🤒': ['face', 'with', 'thermometer', 'sick', 'fever', 'ill'],
  '🤕': ['face', 'with', 'bandage', 'injured', 'hurt', 'wounded'],
  '🤑': ['money', 'mouth', 'face', 'rich', 'greedy', 'dollar', 'cash'],
  '🤠': ['cowboy', 'hat', 'face', 'western', 'country', 'ranch'],
  '😈': ['smiling', 'imp', 'devil', 'evil', 'horns', 'sin'],
  '👿': ['angry', 'imp', 'devil', 'evil', 'horns', 'demon'],
  '👹': ['ogre', 'demon', 'monster', 'evil', 'japanese', 'oni'],
  '👺': ['goblin', 'demon', 'monster', 'evil', 'japanese', 'tengu'],
  '🤡': ['clown', 'face', 'funny', 'silly', 'circus', 'comedy'],
  '💩': ['pile', 'of', 'poo', 'poop', 'crap', 'shit', 'funny'],
  '👻': ['ghost', 'spooky', 'halloween', 'scary', 'spirit', 'dead'],
  '💀': ['skull', 'death', 'dead', 'bones', 'spooky', 'halloween'],
  '☠️': ['skull', 'and', 'crossbones', 'death', 'dead', 'danger', 'poison'],
  '👽': ['alien', 'ufo', 'extraterrestrial', 'space', 'scifi', 'monster'],
  '👾': ['alien', 'monster', 'space', 'invader', 'game', 'arcade'],
  '🤖': ['robot', 'bot', 'mechanical', 'android', 'tech', 'automation'],
  '🎃': ['jack', 'o', 'lantern', 'halloween', 'pumpkin', 'spooky'],
  '👍': ['thumbs', 'up', 'like', 'good', 'yes', 'approve', 'ok'],
  '👎': ['thumbs', 'down', 'dislike', 'bad', 'no', 'disapprove'],
  '👏': ['clapping', 'hands', 'applause', 'clap', 'praise', 'celebrate'],
  '🙌': ['raising', 'hands', 'celebration', 'hooray', 'praise', 'worship'],
  '👋': ['waving', 'hand', 'hello', 'hi', 'bye', 'wave', 'greet'],
  '🤝': ['handshake', 'deal', 'agreement', 'partnership', 'shake', 'hands'],
  '🙏': ['folded', 'hands', 'pray', 'please', 'thanks', 'namaste', 'gratitude'],
  '✌️': ['victory', 'hand', 'peace', 'two', 'fingers', 'v'],
  '🤞': ['crossed', 'fingers', 'luck', 'hope', 'wish', 'pray'],
  '💪': ['flexed', 'biceps', 'strong', 'muscle', 'power', 'workout'],
  '❤️': ['red', 'heart', 'love', 'like', 'favorite', 'romance'],
  '🧡': ['orange', 'heart', 'love', 'affection', 'orange'],
  '💛': ['yellow', 'heart', 'love', 'friendship', 'yellow'],
  '💚': ['green', 'heart', 'love', 'green', 'nature'],
  '💙': ['blue', 'heart', 'love', 'blue', 'trust'],
  '💜': ['purple', 'heart', 'love', 'purple'],
  '🖤': ['black', 'heart', 'love', 'dark', 'black'],
  '🤍': ['white', 'heart', 'love', 'pure', 'white'],
  '💔': ['broken', 'heart', 'sad', 'hurt', 'broken', 'heartbreak'],
  '💕': ['two', 'hearts', 'love', 'affection', 'romance'],
  '💖': ['sparkling', 'heart', 'love', 'shiny', 'sparkle'],
  '💗': ['growing', 'heart', 'love', 'grow', 'expand'],
  '💘': ['heart', 'with', 'arrow', 'cupid', 'love', 'romance'],
  '💝': ['heart', 'with', 'ribbon', 'gift', 'love', 'present'],
  '✅': ['check', 'mark', 'button', 'yes', 'correct', 'done', 'success'],
  '❌': ['cross', 'mark', 'no', 'wrong', 'cancel', 'delete', 'remove'],
  '⭕': ['hollow', 'red', 'circle', 'yes', 'ok', 'correct'],
  '🔥': ['fire', 'flame', 'hot', 'burn', 'lit', 'awesome'],
  '🚀': ['rocket', 'space', 'launch', 'fast', 'speed', 'travel'],
  '💯': ['hundred', 'points', 'perfect', 'score', 'excellent', '100'],
  '🎉': ['party', 'popper', 'celebration', 'congratulations', 'party'],
  '🎊': ['confetti', 'ball', 'celebration', 'party', 'congratulations'],
  '✨': ['sparkles', 'star', 'shine', 'magic', 'sparkle', 'glitter'],
  '⭐': ['star', 'favorite', 'rating', 'like', 'shine'],
  '🌟': ['glowing', 'star', 'favorite', 'rating', 'shine'],
  '💫': ['dizzy', 'star', 'sparkle', 'magic', 'wish'],
  '🎈': ['balloon', 'party', 'celebration', 'birthday', 'fun'],
  '🎁': ['wrapped', 'gift', 'present', 'birthday', 'surprise'],
  '🏆': ['trophy', 'winner', 'award', 'achievement', 'success'],
  '🥇': ['1st', 'place', 'medal', 'gold', 'winner', 'first'],
  '🥈': ['2nd', 'place', 'medal', 'silver', 'second', 'winner'],
  '🥉': ['3rd', 'place', 'medal', 'bronze', 'third', 'winner'],
};

const TeamChat: React.FC = () => {
  const { userProfile, showToast } = useBusiness();
  const [activeChannelId, setActiveChannelId] = useState('General');
  const [activeDmUser, setActiveDmUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('Smileys & People');
  const emojiCategoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingFiles, setPendingFiles] = useState<Array<{file: File, preview: string, id: string, progress?: number, uploading?: boolean, error?: string, uploadedUrl?: string}>>([]);
  const fileUploadTasksRef = useRef<Record<string, UploadTask>>({});
  const [linkPreview, setLinkPreview] = useState<{url: string, title?: string, description?: string, image?: string, siteName?: string} | null>(null);
  const linkPreviewTimeoutRef = useRef<any>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [viewingImage, setViewingImage] = useState<{url: string, name?: string, index?: number} | null>(null);
  const [mediaCarousel, setMediaCarousel] = useState<Array<{url: string, name?: string, type: string}>>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showFileShare, setShowFileShare] = useState(false);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{msgId: string, msgText?: string, fileName?: string} | null>(null);
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);
  const [editingMsg, setEditingMsg] = useState<{id: string, text: string} | null>(null);
  const [editHistory, setEditHistory] = useState<{msgId: string, history: any[]} | null>(null);
  const [channels, setChannels] = useState<Array<{id: string, name: string, description: string, icon: any}>>(CHANNELS);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelType, setNewChannelType] = useState<'standard' | 'broadcast'>('standard');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedChannelUsers, setSelectedChannelUsers] = useState<string[]>([]);
  const [selectedBroadcastUsers, setSelectedBroadcastUsers] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<{id: string, name: string, description: string, memberIds?: string[], createdBy?: string | null, type?: 'standard' | 'broadcast'} | null>(null);
  const [showRemoveMember, setShowRemoveMember] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null);
  const [showEditChannel, setShowEditChannel] = useState(false);
  const [editingChannelName, setEditingChannelName] = useState('');
  const [editingChannelDesc, setEditingChannelDesc] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({});
  const [unreadMessageIndex, setUnreadMessageIndex] = useState<number | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [longPressMenu, setLongPressMenu] = useState<{msgId: string, x: number, y: number, msgText?: string, fileName?: string, isEdited?: boolean} | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const longPressTargetRef = useRef<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const largeFileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const previousMessageIdsRef = useRef<Set<string>>(new Set());
  const isWindowFocusedRef = useRef<boolean>(true);
  const channelsRef = useRef(channels);

  const currentThreadId = activeDmUser 
    ? [userProfile?.id, activeDmUser.id].sort().join('_') 
    : activeChannelId;

  // Handle outside clicks for emoji picker
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Load last read timestamps from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('team_chat_last_read');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLastReadTimestamps(parsed);
      } catch (e) {
        console.error('Error loading last read timestamps:', e);
      }
    }
  }, []);

  // Save last read timestamps to localStorage
  useEffect(() => {
    if (Object.keys(lastReadTimestamps).length > 0) {
      localStorage.setItem('team_chat_last_read', JSON.stringify(lastReadTimestamps));
    }
  }, [lastReadTimestamps]);

  // Calculate unread counts for all channels and DMs using real-time listeners
  useEffect(() => {
    if (!userProfile?.companyId || !userProfile?.id) return;

    const userId = userProfile.id;
    const unsubscribes: (() => void)[] = [];

    // Set up real-time listeners for all threads
    const setupListeners = () => {
      const allThreads: Array<{id: string, name: string}> = [
        ...channels.map(ch => ({ id: ch.id, name: ch.name })),
        ...allUsers.map(u => ({ id: [userId, u.id].sort().join('_'), name: u.fullName }))
      ];

      allThreads.forEach(thread => {
        const threadId = thread.id;
        const lastRead = lastReadTimestamps[threadId] || 0;

        const qMessages = query(
          collection(db, 'team_messages'),
          where('companyId', '==', userProfile.companyId),
          where('channelId', '==', threadId)
        );

        const unsubscribe = onSnapshot(qMessages, (snapshot: any) => {
          let unread = 0;
          const messages: Array<{time: number, senderId: string, deletedFor: string[]}> = [];
          
          snapshot.forEach((doc: any) => {
            const msg = doc.data();
            const msgTime = msg.timestamp?.toMillis?.() || msg.timestamp || 0;
            messages.push({
              time: msgTime,
              senderId: msg.senderId || '',
              deletedFor: msg.deletedFor || []
            });
          });
          
          // Sort by timestamp descending
          messages.sort((a, b) => b.time - a.time);
          
          // Count unread messages
          for (const msg of messages) {
            if (msg.time <= lastRead) {
              // Stop counting once we hit messages we've already read
              break;
            }
            // Count as unread if:
            // 1. Message is newer than last read time
            // 2. Message is not from current user
            // 3. Message is not deleted for current user
            if (msg.senderId !== userId && !msg.deletedFor.includes(userId)) {
              unread++;
            }
          }
          
          setUnreadCounts(prev => {
            const updated = { ...prev, [threadId]: unread };
            if (unread > 0) {
              console.log(`Unread count for ${threadId}:`, unread);
            }
            return updated;
          });
        }, (error: any) => {
          console.warn('Error listening to messages for', threadId, error);
        });

        unsubscribes.push(unsubscribe);
      });
    };

    setupListeners();
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [userProfile?.companyId, userProfile?.id, channels, allUsers, lastReadTimestamps]);

  // Handle drag and drop
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFiles(Array.from(files));
      }
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Presence & Heartbeat
  useEffect(() => {
    if (!userProfile?.id) return;
    
    const presenceRef = doc(db, 'users', userProfile.id);
    updateDoc(presenceRef, { status: 'ONLINE', lastSeen: serverTimestamp() }).catch(() => {
      // Fallback for first-time status setting if document doesn't exist yet for some reason
      setDoc(presenceRef, { status: 'ONLINE', lastSeen: serverTimestamp() }, { merge: true });
    });

    const interval = setInterval(() => {
      updateDoc(presenceRef, { lastSeen: serverTimestamp() }).catch(() => {});
    }, 60000);

    const handleOffline = () => updateDoc(presenceRef, { status: 'OFFLINE', lastSeen: serverTimestamp() }).catch(() => {});
    window.addEventListener('beforeunload', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleOffline);
      handleOffline();
    };
  }, [userProfile?.id]);

  // Fetch Users & Messages
  useEffect(() => {
    if (!userProfile?.companyId) return;

    // Load channels from Firestore
    const qChannels = query(collection(db, 'team_channels'), where('companyId', '==', userProfile.companyId));
    const unsubChannels = onSnapshot(qChannels, (snap: any) => {
      const firestoreChannels = snap.docs.map((d: any) => {
        const data = d.data();
        // Map icon string to component
        const iconMap: Record<string, any> = {
          'Hash': Hash,
          'Briefcase': Briefcase,
          'CreditCard': CreditCard,
          'Users': UsersIcon,
          'Radio': Radio
        };
        return {
          id: d.id,
          name: data.name,
          description: data.description,
          icon: iconMap[data.icon] || Hash,
          memberIds: data.memberIds || [],
          createdBy: data.createdBy || null,
          type: data.type || 'standard'
        };
      });
      // Merge with default channels
      const defaultChannelIds = CHANNELS.map(c => c.id);
      const customChannels = firestoreChannels.filter((c: any) => !defaultChannelIds.includes(c.id));
      const allChannels = [...CHANNELS.map(c => ({ ...c, memberIds: [] as string[], createdBy: undefined as string | undefined })), ...customChannels];
      setChannels(allChannels);
      channelsRef.current = allChannels;
    });

    const qUsers = query(collection(db, 'users'), where('companyId', '==', userProfile.companyId));
    // Explicitly cast snap as any to avoid inference error on .docs
    const unsubUsers = onSnapshot(qUsers, (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => d.data() as UserProfile).filter((u: UserProfile) => u.id !== userProfile.id));
    });

    setLoading(true);
    const qMsgs = query(
      collection(db, 'team_messages'),
      where('companyId', '==', userProfile.companyId),
      where('channelId', '==', currentThreadId)
    );

    // Explicitly cast snapshot as any to avoid inference error on .docs
    const unsubMsgs = onSnapshot(qMsgs, (snapshot: any) => {
      const rawMsgs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as TeamMessage[];
      const sortedMsgs = rawMsgs.sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
      
      // Detect new messages for browser notifications
      if (userProfile?.id) {
        const currentMessageIds = new Set(sortedMsgs.map(m => m.id));
        const previousIds = previousMessageIdsRef.current;
        
        // Find new messages (messages that weren't in the previous set)
        // Since we're listening to the current thread only, we only notify if window is not focused
        const newMessages = sortedMsgs.filter(msg => {
          const isNew = !previousIds.has(msg.id);
          const isFromOtherUser = msg.senderId !== userProfile.id;
          const isNotDeleted = !(msg.deletedFor || []).includes(userProfile.id);
          const shouldNotify = isNew && isFromOtherUser && isNotDeleted && !isWindowFocusedRef.current;
          
          return shouldNotify;
        });
        
        // Show browser notifications for new messages
        newMessages.forEach(async (msg) => {
          // Get channel name - handle both channels and DMs
          let channelName = 'Team Chat';
          if (activeDmUser) {
            channelName = activeDmUser.fullName || 'Direct Message';
          } else if (activeChannelId === 'General') {
            channelName = 'General';
          } else {
            // Find channel name from current channels ref (always up-to-date)
            const channel = channelsRef.current.find(c => c.id === activeChannelId);
            channelName = channel?.name || 'Team Chat';
          }
          
          const messagePreview = (msg.text || '').length > 50 ? (msg.text || '').substring(0, 50) + '...' : (msg.text || '');
          const title = msg.fileUrl ? `📎 ${msg.senderName || 'Someone'}` : (msg.senderName || 'Someone');
          const body = msg.fileUrl ? `${msg.fileName || 'File'}` : messagePreview;
          
          try {
            await notificationService.showBrowserNotification({
              id: `team-msg-${msg.id}`,
              companyId: userProfile.companyId || '',
              title: `${title} (${channelName})`,
              description: body,
              timestamp: new Date().toLocaleTimeString(),
              type: 'update',
              isRead: false
            });
          } catch (error) {
            console.error('Failed to show notification:', error);
          }
        });
        
        // Update previous message IDs
        previousMessageIdsRef.current = currentMessageIds;
      }
      
      setMessages(sortedMsgs);
      setLoading(false);
      
      // Mark messages as read when viewing this chat and find unread message index
      if (currentThreadId && userProfile?.id) {
        const lastRead = lastReadTimestamps[currentThreadId] || 0;
        
        // Find first unread message index for WhatsApp-style indicator
        let unreadIndex = -1;
        let unreadCount = 0;
        sortedMsgs.forEach((msg: any, idx: number) => {
          const msgTime = msg.timestamp?.toMillis?.() || msg.timestamp || 0;
          if (msgTime > lastRead && msg.senderId !== userProfile.id && !(msg.deletedFor || []).includes(userProfile.id)) {
            if (unreadIndex === -1) unreadIndex = idx;
            unreadCount++;
          }
        });
        
        // Only set unread index if there are actually unread messages (not at the bottom)
        if (unreadIndex >= 0 && unreadIndex < sortedMsgs.length - 1) {
          setUnreadMessageIndex(unreadIndex);
        } else {
          setUnreadMessageIndex(null);
          // If at bottom, mark as read immediately
          if (sortedMsgs.length > 0) {
            const now = Date.now();
            setLastReadTimestamps((prev: Record<string, number>) => {
              const newTimestamps = { ...prev, [currentThreadId]: now };
              localStorage.setItem('team_chat_last_read', JSON.stringify(newTimestamps));
              return newTimestamps;
            });
            setUnreadCounts((prev: Record<string, number>) => ({ ...prev, [currentThreadId]: 0 }));
          }
        }
      }
      
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });

    const qTyping = query(
      collection(db, 'typing_indicators'),
      where('channelId', '==', currentThreadId)
    );
    // Explicitly cast snap as any to avoid inference error on .docs
    const unsubTyping = onSnapshot(qTyping, (snap: any) => {
      const typers = snap.docs
        .map((d: any) => d.data())
        .filter((d: any) => d.userId !== userProfile.id && (Date.now() - d.timestamp < 5000))
        .map((d: any) => d.userName);
      setTypingUsers(typers);
    });

    return () => {
      unsubChannels();
      unsubUsers();
      unsubMsgs();
      unsubTyping();
      // Reset previous message IDs when thread changes
      previousMessageIdsRef.current = new Set();
    };
  }, [userProfile?.companyId, currentThreadId, userProfile?.id, activeChannelId, activeDmUser]);

  // Track window focus state for notifications
  useEffect(() => {
    const handleFocus = () => {
      isWindowFocusedRef.current = true;
    };
    
    const handleBlur = () => {
      isWindowFocusedRef.current = false;
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Update current channel when activeChannelId or channels change
  useEffect(() => {
    if (!activeDmUser && activeChannelId && channels.length > 0) {
      const activeChannel = channels.find(ch => ch.id === activeChannelId);
      if (activeChannel) {
        // For General channel, all users are members by default
        const isGeneral = activeChannel.id === 'General';
        setCurrentChannel({
          id: activeChannel.id,
          name: activeChannel.name,
          description: activeChannel.description,
          memberIds: isGeneral ? [] : ((activeChannel as any).memberIds || []), // Empty array means all members for General
          createdBy: (activeChannel as any).createdBy || undefined
        });
      } else {
        // Default channel (General)
        setCurrentChannel({
          id: activeChannelId,
          name: activeChannelId,
          description: CHANNELS.find(c => c.id === activeChannelId)?.description || 'Channel',
          memberIds: [], // General has all members
          createdBy: undefined
        });
      }
    } else if (activeDmUser) {
      setCurrentChannel(null);
    }
  }, [activeChannelId, activeDmUser, channels]);

  // Keep channelsRef in sync with channels state
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowChannelMenu(false);
      }
    };

    if (showChannelMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChannelMenu]);

  // Collect all media from messages for carousel
  useEffect(() => {
    const mediaItems: Array<{url: string, name?: string, type: string}> = [];
    messages.forEach(msg => {
      if (msg.fileUrl && (msg.fileType?.startsWith('image/') || msg.fileType?.startsWith('video/'))) {
        mediaItems.push({
          url: msg.fileUrl,
          name: msg.fileName || 'Media',
          type: msg.fileType || 'image'
        });
      }
    });
    setMediaCarousel(mediaItems);
  }, [messages]);

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!viewingImage) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousMedia();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      } else if (e.key === 'Escape') {
        setViewingImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewingImage, currentMediaIndex, mediaCarousel]);

  const handleNextMedia = () => {
    if (mediaCarousel.length === 0) return;
    setSlideDirection('left');
    const nextIndex = (currentMediaIndex + 1) % mediaCarousel.length;
    setCurrentMediaIndex(nextIndex);
    setViewingImage({
      url: mediaCarousel[nextIndex].url,
      name: mediaCarousel[nextIndex].name,
      index: nextIndex
    });
  };

  const handlePreviousMedia = () => {
    if (mediaCarousel.length === 0) return;
    setSlideDirection('right');
    const prevIndex = (currentMediaIndex - 1 + mediaCarousel.length) % mediaCarousel.length;
    setCurrentMediaIndex(prevIndex);
    setViewingImage({
      url: mediaCarousel[prevIndex].url,
      name: mediaCarousel[prevIndex].name,
      index: prevIndex
    });
  };

  // Extract URL from text
  const extractUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches && matches.length > 0 ? matches[0] : null;
  };

  // Fetch link preview metadata
  const fetchLinkPreview = async (url: string) => {
    try {
      // Use a CORS proxy or link preview API
      // For now, we'll use a simple approach with a CORS proxy
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        const getMetaContent = (property: string) => {
          const meta = doc.querySelector(`meta[property="${property}"]`) || 
                      doc.querySelector(`meta[name="${property}"]`);
          return meta?.getAttribute('content') || '';
        };

        const title = getMetaContent('og:title') || doc.querySelector('title')?.textContent || '';
        const description = getMetaContent('og:description') || getMetaContent('description') || '';
        const image = getMetaContent('og:image') || '';
        const siteName = getMetaContent('og:site_name') || new URL(url).hostname;

        if (title || description || image) {
          setLinkPreview({ url, title, description, image, siteName });
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching link preview:', error);
    }
    
    // Fallback: create basic preview from URL
    try {
      const urlObj = new URL(url);
      setLinkPreview({
        url,
        title: urlObj.hostname,
        description: url,
        siteName: urlObj.hostname
      });
    } catch (e) {
      // Invalid URL, don't show preview
      setLinkPreview(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    if (!userProfile) return;

    const typingRef = doc(db, 'typing_indicators', `${currentThreadId}_${userProfile.id}`);
    setDoc(typingRef, {
      channelId: currentThreadId,
      userId: userProfile.id,
      userName: userProfile.fullName,
      timestamp: Date.now()
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      deleteDoc(typingRef).catch(() => {});
    }, 3000);

    // Check for URLs and fetch preview
    if (linkPreviewTimeoutRef.current) {
      clearTimeout(linkPreviewTimeoutRef.current);
    }

    linkPreviewTimeoutRef.current = setTimeout(() => {
      const url = extractUrl(value);
      if (url) {
        fetchLinkPreview(url);
      } else {
        setLinkPreview(null);
      }
    }, 1000); // Debounce link preview fetching
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.startsWith('video/')) return Video;
    if (fileType === 'application/pdf') return FileType;
    if (fileType?.includes('word') || fileType?.includes('document')) return FileText;
    if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) return FileSpreadsheet;
    if (fileType?.includes('code') || fileType?.includes('text')) return FileCode;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // WhatsApp-like image compression
  const compressImage = async (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file); // Return original if canvas fails
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Convert blob to File using Object.assign
                const compressedFile = Object.assign(blob, {
                  name: file.name,
                  lastModified: Date.now(),
                }) as File;
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: File[], isLargeFile = false) => {
    if (!userProfile || files.length === 0) return;

    // Check authentication
    if (!auth.currentUser) {
      showToast('Authentication required', 'error');
      return;
    }

    // Process each file - only create previews, don't upload yet (Teams-like)
    for (const file of files) {
      const maxSize = isLargeFile ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for large files, 10MB for regular
      if (file.size > maxSize) {
        showToast(`${file.name} is too large. Maximum size is ${isLargeFile ? '100MB' : '10MB'}`, 'error');
        continue;
      }

      // For large files, use file sharing
      if (isLargeFile || file.size > 5 * 1024 * 1024) {
        setShareFile(file);
        setShowFileShare(true);
        return;
      }

      // Create preview and add to pending files (Teams-like - preview only, upload on send)
      let fileToPreview = file;
      let previewUrl = '';
      const fileId = `file-${Date.now()}-${Math.random()}-${file.name}`;
      
    if (file.type.startsWith('image/')) {
        // Compress images for preview
        try {
          fileToPreview = await compressImage(file);
          previewUrl = URL.createObjectURL(fileToPreview);
        } catch (err) {
          console.warn('Compression failed, using original:', err);
          previewUrl = URL.createObjectURL(file);
        }
        setPendingFiles(prev => [...prev, { file: fileToPreview, preview: previewUrl, id: fileId, progress: 0, uploading: false }]);
      } else if (file.type.startsWith('video/')) {
        // Create video preview
        previewUrl = URL.createObjectURL(file);
        setPendingFiles(prev => [...prev, { file, preview: previewUrl, id: fileId, progress: 0, uploading: false }]);
      } else {
        // For other files, add to pending with no preview
        setPendingFiles(prev => [...prev, { file, preview: '', id: fileId, progress: 0, uploading: false }]);
      }
    }
  };

  const handleLargeFileShare = async () => {
    if (!shareFile || !userProfile) return;

    try {
      // Refresh token
      await auth.currentUser?.getIdToken(true);
    } catch (err) {
      console.warn('Token refresh failed:', err);
    }

    const sanitizedFileName = shareFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageRef = ref(storage, `chat/${userProfile.companyId}/shared/${Date.now()}_${sanitizedFileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, shareFile, {
      contentType: shareFile.type,
      customMetadata: {
        originalFileName: shareFile.name,
        uploadedBy: userProfile.id,
        uploadedAt: new Date().toISOString(),
        isShared: 'true'
      }
    });

    setUploadProgress(1);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.max(1, Math.min(99, progress)));
      },
      (error: any) => { 
        console.error("Upload Error:", error);
        setUploadProgress(null);
        showToast('Upload failed: ' + (error.message || 'Unknown error'), 'error');
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          const shareUrl = `${window.location.origin}/#/share/${encodeURIComponent(url)}`;
          setShareLink(shareUrl);
          await sendMessage(`📎 Shared file: ${shareFile.name}\n🔗 ${shareUrl}`, undefined);
          setUploadProgress(null);
          showToast('File shared successfully');
        } catch (e: any) {
          console.error('Error finalizing upload:', e);
          showToast('Error finalizing upload', 'error');
          setUploadProgress(null);
        }
      }
    );
  };

  const uploadFile = async (file: File, fileId: string, previewUrl: string): Promise<string | null> => {
    if (!userProfile) return null;

    return new Promise((resolve, reject) => {
      try {
        // Refresh token
        auth.currentUser?.getIdToken(true).catch(err => {
          console.warn('Token refresh failed:', err);
        });

        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageRef = ref(storage, `chat/${userProfile.companyId}/${Date.now()}_${sanitizedFileName}`);
        
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
          customMetadata: {
            originalFileName: file.name,
            uploadedBy: userProfile.id,
            uploadedAt: new Date().toISOString()
          }
        });
        
        // Store upload task for this file
        fileUploadTasksRef.current[fileId] = uploadTask;

        // Update pending file to show uploading state
        setPendingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, uploading: true, progress: 0 } : f
        ));

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // Update individual file progress
            setPendingFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, progress: Math.max(1, Math.min(99, progress)) } : f
            ));
          },
          (error: any) => {
            console.error("Upload Error:", error);
            // Update file with error
            setPendingFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, uploading: false, error: error.message || 'Upload failed' } : f
            ));
            delete fileUploadTasksRef.current[fileId];
            URL.revokeObjectURL(previewUrl);
            
        if (error.code === 'storage/canceled') {
              showToast(`${file.name} upload canceled`, 'info');
            } else if (error.code === 'storage/unauthorized') {
              showToast('Unauthorized. Please check storage permissions', 'error');
        } else {
              showToast(`${file.name} upload failed: ${error.message || 'Unknown error'}`, 'error');
        }
            reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          // Update pending file to show upload completed - but don't send yet, only when send button is clicked
          setPendingFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, uploading: false, progress: 100 } : f
          ));
          delete fileUploadTasksRef.current[fileId];
          URL.revokeObjectURL(previewUrl);
          // Resolve with URL - this will be used by sendMessage to send the file
          resolve(url);
        } catch (e: any) {
          console.error('Error finalizing upload:', e);
          setPendingFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, uploading: false, error: 'Error finalizing upload' } : f
          ));
          delete fileUploadTasksRef.current[fileId];
          URL.revokeObjectURL(previewUrl);
          reject(e);
        }
      }
    );
      } catch (error: any) {
        console.error('Upload initialization error:', error);
        setPendingFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, uploading: false, error: 'Failed to start upload' } : f
        ));
        URL.revokeObjectURL(previewUrl);
        reject(error);
      }
    });
  };

  const removePendingFile = (fileId: string) => {
    setPendingFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      // Cancel upload if in progress
      const uploadTask = fileUploadTasksRef.current[fileId];
      if (uploadTask) {
        uploadTask.cancel();
        delete fileUploadTasksRef.current[fileId];
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !userProfile) return;
    handleFiles(Array.from(files));

  };


  const handleDeleteClick = (msgId: string, msgText?: string, fileName?: string) => {
    setDeleteConfirm({ msgId, msgText, fileName });
    setDeleteForEveryone(false);
  };

  const deleteMessage = async (msgId: string, forEveryone: boolean = false) => {
    try {
      if (forEveryone) {
        // Delete for everyone - remove the message completely
      await deleteDoc(doc(db, 'team_messages', msgId));
        showToast('Message deleted for everyone', 'info');
      } else {
        // Delete for me only - mark as deleted for this user
        await updateDoc(doc(db, 'team_messages', msgId), {
          deletedFor: arrayUnion(userProfile?.id || ''),
          updatedAt: serverTimestamp()
        });
        showToast('Message deleted', 'info');
      }
      setDeleteConfirm(null);
    } catch (e: any) {
      console.error('Delete error:', e);
      showToast('Delete failed: ' + (e.message || 'Unknown error'), 'error');
      setDeleteConfirm(null);
    }
  };

  const handleEditClick = (msgId: string, currentText: string) => {
    setEditingMsg({ id: msgId, text: currentText });
  };

  const saveEdit = async () => {
    if (!editingMsg || !userProfile) return;
    
    try {
      const msgRef = doc(db, 'team_messages', editingMsg.id);
      const msgSnap = await getDoc(msgRef);
      
      if (!msgSnap.exists()) {
        showToast('Message not found', 'error');
        setEditingMsg(null);
        return;
      }

      const currentData = msgSnap.data();
      const originalText = currentData.originalText || currentData.text;
      const editHistory = currentData.editHistory || [];
      
      // Add current version to history before updating
      const newHistoryEntry = {
        text: currentData.text,
        editedAt: currentData.editedAt || currentData.timestamp,
        editedBy: currentData.editedBy || currentData.senderId
      };
      
      await updateDoc(msgRef, {
        text: editingMsg.text,
        originalText: originalText,
        editHistory: [...editHistory, newHistoryEntry],
        editedAt: serverTimestamp(),
        editedBy: userProfile.id,
        isEdited: true
      });
      
      showToast('Message updated', 'success');
      setEditingMsg(null);
    } catch (e: any) {
      console.error('Edit error:', e);
      showToast('Edit failed: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const viewEditHistory = async (msgId: string) => {
    try {
      const msgRef = doc(db, 'team_messages', msgId);
      const msgSnap = await getDoc(msgRef);
      
      if (!msgSnap.exists()) {
        showToast('Message not found', 'error');
        return;
      }

      const data = msgSnap.data();
      const history = data.editHistory || [];
      const originalText = data.originalText || data.text;
      
      // Include original as first entry
      const fullHistory = [
        { text: originalText, editedAt: data.timestamp, editedBy: data.senderId, isOriginal: true },
        ...history,
        { text: data.text, editedAt: data.editedAt || data.timestamp, editedBy: data.editedBy || data.senderId, isCurrent: true }
      ];
      
      setEditHistory({ msgId, history: fullHistory });
    } catch (e: any) {
      console.error('History error:', e);
      showToast('Failed to load history', 'error');
    }
  };

  const isOwner = userProfile?.role === 'OWNER' || userProfile?.role === 'SUPER_ADMIN';

  const editChannel = async () => {
    if (!userProfile || !currentChannel || !editingChannelName.trim()) {
      showToast('Channel name is required', 'error');
      return;
    }

    // Check if user is the creator
    if (currentChannel.createdBy !== userProfile.id && !isOwner) {
      showToast('Only the creator or owner can edit this channel', 'error');
      return;
    }

    // Check if it's a default channel
    const defaultChannelIds = CHANNELS.map(c => c.id);
    if (defaultChannelIds.includes(currentChannel.id)) {
      showToast('Cannot edit default channels', 'error');
      return;
    }

    try {
      const channelRef = doc(db, 'team_channels', currentChannel.id);
      await updateDoc(channelRef, {
        name: editingChannelName.trim(),
        description: editingChannelDesc.trim() || 'Team communication channel',
        updatedAt: serverTimestamp()
      });
      
      showToast('Channel updated successfully', 'success');
      setShowEditChannel(false);
      setEditingChannelName('');
      setEditingChannelDesc('');
    } catch (e: any) {
      console.error('Edit channel error:', e);
      showToast('Failed to update channel: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!userProfile || !isOwner) {
      showToast('Only owners can delete channels', 'error');
      return;
    }

    try {
      // Check if this is a default channel
      const defaultChannelIds = CHANNELS.map(c => c.id);
      if (defaultChannelIds.includes(channelId)) {
        showToast('Cannot delete default channels', 'error');
        return;
      }

      // Check if user is the creator
      const channelRef = doc(db, 'team_channels', channelId);
      const channelSnap = await getDoc(channelRef);
      
      if (!channelSnap.exists()) {
        showToast('Channel not found', 'error');
        return;
      }

      const channelData = channelSnap.data();
      if (channelData.createdBy !== userProfile.id) {
        showToast('Only the creator can delete this channel', 'error');
        return;
      }

      // Delete the channel
      await deleteDoc(channelRef);

      // If this was the active channel, switch to General
      if (activeChannelId === channelId) {
        setActiveChannelId('General');
        setActiveDmUser(null);
      }

      showToast('Channel deleted successfully', 'success');
      setChannelToDelete(null);
    } catch (e: any) {
      console.error('Delete channel error:', e);
      showToast('Failed to delete channel: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const removeMemberFromChannel = async (channelId: string, userId: string) => {
    if (!userProfile || !currentChannel) return;

    // Only owner or channel creator can remove members
    if (currentChannel.createdBy !== userProfile.id && !isOwner) {
      showToast('You do not have permission to remove members', 'error');
      return;
    }

    try {
      const channelRef = doc(db, 'team_channels', channelId);
      const channelSnap = await getDoc(channelRef);
      
      if (!channelSnap.exists()) {
        showToast('Channel not found', 'error');
        return;
      }

      const currentMemberIds = channelSnap.data().memberIds || [];
      const updatedMemberIds = currentMemberIds.filter((id: string) => id !== userId);

      await updateDoc(channelRef, {
        memberIds: updatedMemberIds
      });

      showToast('Member removed successfully', 'success');
      
      // Update current channel state
      setCurrentChannel({
        ...currentChannel,
        memberIds: updatedMemberIds
      });
    } catch (e: any) {
      console.error('Remove member error:', e);
      showToast('Failed to remove member: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim() 
    ? messages.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const createChannel = async () => {
    if (!userProfile || !newChannelName.trim()) {
      showToast('Channel name is required', 'error');
      return;
    }

    try {
      // For broadcast channels, all company members are automatically included
      const memberIds = newChannelType === 'broadcast' 
        ? [] // Empty means all members (similar to General)
        : [userProfile.id, ...selectedChannelUsers];
      
      await addDoc(collection(db, 'team_channels'), {
        companyId: userProfile.companyId,
        name: newChannelName.trim(),
        description: newChannelDesc.trim() || (newChannelType === 'broadcast' ? 'Announcements and HR communications' : 'Team communication channel'),
        icon: newChannelType === 'broadcast' ? 'Radio' : 'Hash',
        type: newChannelType,
        createdBy: userProfile.id,
        createdAt: serverTimestamp(),
        memberIds: memberIds
      });
      
      showToast(`Channel created successfully (${newChannelType === 'broadcast' ? 'Broadcast' : 'Standard'})`, 'success');
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelType('standard');
      setSelectedChannelUsers([]);
    } catch (e: any) {
      console.error('Create channel error:', e);
      showToast('Failed to create channel: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const sendBroadcast = async () => {
    if (!userProfile || !broadcastMessage.trim() || (selectedChannels.length === 0 && selectedBroadcastUsers.length === 0)) {
      showToast('Please select channels/users and enter a message', 'error');
      return;
    }

    try {
      const promises: Promise<any>[] = [];
      
      // Send to selected channels
      selectedChannels.forEach(channelId => {
        promises.push(
          addDoc(collection(db, 'team_messages'), {
            companyId: userProfile.companyId,
            channelId: channelId,
            senderId: userProfile.id,
            senderName: userProfile.fullName,
            senderRole: userProfile.role,
            senderAvatar: userProfile.avatarUrl || null,
            text: broadcastMessage.trim(),
            fileUrl: null,
            fileName: null,
            fileType: null,
            fileSize: null,
            timestamp: serverTimestamp(),
            isBroadcast: true
          })
        );
      });

      // Send to selected users via DM thread IDs
      selectedBroadcastUsers.forEach(userId => {
        const threadId = [userProfile.id, userId].sort().join('_');
        promises.push(
          addDoc(collection(db, 'team_messages'), {
            companyId: userProfile.companyId,
            channelId: threadId,
            senderId: userProfile.id,
            senderName: userProfile.fullName,
            senderRole: userProfile.role,
            senderAvatar: userProfile.avatarUrl || null,
            text: broadcastMessage.trim(),
            fileUrl: null,
            fileName: null,
            fileType: null,
            fileSize: null,
            timestamp: serverTimestamp(),
            isBroadcast: true
          })
        );
      });

      await Promise.all(promises);
      const totalCount = selectedChannels.length + selectedBroadcastUsers.length;
      showToast(`Broadcast sent to ${totalCount} recipient(s)`, 'success');
      setShowBroadcast(false);
      setBroadcastMessage('');
      setSelectedChannels([]);
      setSelectedBroadcastUsers([]);
    } catch (e: any) {
      console.error('Broadcast error:', e);
      showToast('Failed to send broadcast: ' + (e.message || 'Unknown error'), 'error');
    }
  };

  const sendMessage = async (text: string, file?: { url: string, name: string, type: string, size: number }) => {
    if (!userProfile || (!text.trim() && !file && pendingFiles.length === 0 && !linkPreview)) return;
    
    // Check if current channel is a broadcast channel and user is not owner/admin
    if (!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner) {
      showToast('Only owners and admins can post in broadcast channels', 'error');
      return;
    }

    // Store link preview before clearing
    const previewToSend = linkPreview;

    // If there are pending files, upload them first (ONLY when send button is clicked)
    if (pendingFiles.length > 0) {
      const filesToUpload = [...pendingFiles];
      const uploadedFiles: Array<{ url: string, name: string, type: string, size: number }> = [];
      
      // Check if any files are already uploading (shouldn't happen, but safety check)
      const uploadingFiles = filesToUpload.filter(f => f.uploading);
      if (uploadingFiles.length > 0) {
        showToast('Please wait for current uploads to finish', 'info');
        return;
      }

      // Upload all files now (ONLY when send button is clicked - not automatically)
      for (const pendingFile of filesToUpload) {
        try {
          // Upload file now - this happens only when send button is clicked
          const url = await uploadFile(pendingFile.file, pendingFile.id, pendingFile.preview);
          if (url) {
            uploadedFiles.push({
              url,
              name: pendingFile.file.name,
              type: pendingFile.file.type,
              size: pendingFile.file.size
            });
          }
        } catch (error) {
          console.error('Failed to upload file:', pendingFile.file.name, error);
          showToast(`Failed to upload ${pendingFile.file.name}`, 'error');
          // Continue with other files
        }
      }

      // Only send messages if we have files or text (and only when send button was clicked)
      if (uploadedFiles.length > 0 || text.trim() || linkPreview) {
        // Send first file with text and link preview, or just text if no files
        if (uploadedFiles.length > 0) {
          await sendMessageToDB(text.trim(), uploadedFiles[0], linkPreview);
          // Send remaining files as separate messages
          for (let i = 1; i < uploadedFiles.length; i++) {
            await sendMessageToDB('', uploadedFiles[i]);
          }
        } else {
          await sendMessageToDB(text.trim(), undefined, linkPreview);
        }
      }

      // Clear pending files and link preview after sending
      filesToUpload.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setPendingFiles([]);
      setInput('');
      setLinkPreview(null);
      return;
    }
    
    // Regular message send (no pending files, but may have link preview)
    await sendMessageToDB(text.trim(), file, previewToSend);
    setInput('');
    setLinkPreview(null);
  };

  const sendMessageToDB = async (text: string, file?: { url: string, name: string, type: string, size: number }, linkPreviewData?: {url: string, title?: string, description?: string, image?: string, siteName?: string} | null) => {
    if (!userProfile || (!text.trim() && !file && !linkPreviewData)) return;
    
    try {
      await addDoc(collection(db, 'team_messages'), {
        companyId: userProfile.companyId,
        channelId: currentThreadId,
        senderId: userProfile.id,
        senderName: userProfile.fullName,
        senderRole: userProfile.role,
        senderAvatar: userProfile.avatarUrl || null,
        text: text.trim(),
        fileUrl: file?.url || null,
        fileName: file?.name || null,
        fileType: file?.type || null,
        fileSize: file?.size || null,
        linkPreview: linkPreviewData ? {
          url: linkPreviewData.url,
          title: linkPreviewData.title || null,
          description: linkPreviewData.description || null,
          image: linkPreviewData.image || null,
          siteName: linkPreviewData.siteName || null
        } : null,
        timestamp: serverTimestamp(),
      });
      const typingRef = doc(db, 'typing_indicators', `${currentThreadId}_${userProfile.id}`);
      deleteDoc(typingRef).catch(() => {});
    } catch (err) {
      showToast('Connection failed', 'error');
    }
  };

  const formatLastSeen = (lastSeen: any) => {
    if (!lastSeen) return 'OFFLINE';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'ONLINE';
    if (diff < 3600) return `LAST SEEN ${Math.floor(diff/60)}M AGO`;
    return `LAST SEEN ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderFileContent = (msg: TeamMessage) => {
    if (!msg.fileUrl) return null;
    const isImg = msg.fileType?.startsWith('image/');
    const isVideo = msg.fileType?.startsWith('video/');
    const FileIcon = getFileIcon(msg.fileType || '');

    if (isImg && msg.fileUrl) {
      const fileUrl = msg.fileUrl;
      const fileName = msg.fileName || 'Image';
      // Find index in mediaCarousel
      const mediaIndex = mediaCarousel.findIndex(m => m.url === fileUrl);
      
      return (
        <div className="mt-2 relative group rounded-2xl overflow-hidden max-w-sm cursor-pointer shadow-xl animate-enter">
           <img 
            src={fileUrl} 
            className="w-full h-auto object-cover max-h-[400px] hover:opacity-95 transition-opacity" 
            onClick={() => {
              const index = mediaIndex >= 0 ? mediaIndex : 0;
              setCurrentMediaIndex(index);
              setSlideDirection('right');
              setViewingImage({ url: fileUrl, name: fileName, index });
            }} 
            alt={fileName}
            loading="lazy"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
           <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const index = mediaIndex >= 0 ? mediaIndex : 0;
                  setCurrentMediaIndex(index);
                  setSlideDirection('right');
                  setViewingImage({ url: fileUrl, name: fileName, index }); 
                }} 
                className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 transition-all shadow-lg hover:scale-110 active:scale-95"
                title="View full screen"
              >
                <Maximize2 size={16} />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const a = document.createElement('a');
                  a.href = fileUrl;
                  a.download = fileName;
                  a.click();
                }} 
                className="p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 transition-all shadow-lg hover:scale-110 active:scale-95"
                title="Download"
              >
                <Download size={16} />
              </button>
           </div>
        </div>
      );
    }
    
    if (isVideo && msg.fileUrl) {
      const fileUrl = msg.fileUrl;
      const fileName = msg.fileName || 'Video';
      const mediaIndex = mediaCarousel.findIndex(m => m.url === fileUrl);
      
      return (
        <div className="mt-2 rounded-2xl overflow-hidden max-w-sm shadow-xl group relative animate-enter">
           <video controls src={msg.fileUrl} className="w-full max-h-[300px] rounded-2xl" />
           <button 
             onClick={(e) => {
               e.stopPropagation();
               const index = mediaIndex >= 0 ? mediaIndex : 0;
               setCurrentMediaIndex(index);
               setSlideDirection('right');
               setViewingImage({ url: fileUrl, name: fileName, index });
             }}
             className="absolute top-3 right-3 p-2.5 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-black/80 transition-all shadow-lg hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
             title="View full screen"
           >
             <Maximize2 size={16} />
           </button>
        </div>
      );
    }
    
    if (isVideo && msg.fileUrl) {
    return (
        <div className="mt-2 rounded-2xl overflow-hidden max-w-sm shadow-xl">
           <video controls src={msg.fileUrl} className="w-full max-h-[300px] rounded-2xl" />
        </div>
      );
    }
    
    return (
      <div className="mt-2 flex items-center gap-3 p-3 bg-[var(--bg-card-muted)] rounded-xl border border-[var(--border-ui)] hover:border-[var(--accent)]/50 transition-all group shadow-lg max-w-sm cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')}>
        <div className="w-10 h-10 flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg shrink-0 group-hover:bg-[var(--accent)]/20 transition-colors">
           <FileIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[var(--text-primary)] truncate">{msg.fileName || 'File'}</p>
          <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5">
            {formatFileSize(msg.fileSize || 0)} • {msg.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); window.open(msg.fileUrl, '_blank'); }}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] rounded-lg transition-all"
        >
          <Download size={16} />
        </button>
      </div>
    );
  };

  if (!userProfile?.companyId) return <div className="h-full flex items-center justify-center p-12 text-[var(--text-secondary)] uppercase tracking-[0.5em] text-[10px] animate-pulse">Initialising Secure Subspace...</div>;

  return (
    <div className="h-full flex overflow-hidden bg-[var(--bg-card)] border-0 md:border border-[var(--border-ui)] rounded-2xl lg:rounded-[3rem] shadow-2xl animate-enter relative">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        w-72 lg:w-80 border-r border-[var(--border-ui)] bg-[var(--bg-card-muted)] 
        flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:flex
      `}>
        <header className="p-4 md:p-6 lg:p-8 border-b border-[var(--border-ui)] flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0"><Users size={20} className="md:w-6 md:h-6"/></div>
          <div className="min-w-0">
            <h3 className="text-xs md:text-sm font-black uppercase text-[var(--text-primary)] tracking-tight truncate">Team Hub</h3>
            <p className="text-[8px] text-[var(--accent)] font-black uppercase tracking-[0.4em] mt-1 truncate">{userProfile.companyName}</p>
          </div>
        </header>

        <nav className="flex-1 p-3 md:p-4 lg:p-6 space-y-6 md:space-y-8 overflow-y-auto custom-scroll">
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Channels</p>
               {isOwner && (
                 <button
                   onClick={() => setShowCreateChannel(true)}
                   className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                   title="Create Channel"
                 >
                   <Plus size={14} />
                 </button>
               )}
            </div>
            <div className="space-y-0.5 md:space-y-1">
              {channels.map(ch => {
                const isBroadcast = (ch as any).type === 'broadcast';
                const unreadCount = unreadCounts[ch.id] || 0;
                return (
                <button 
                  key={ch.id} 
                    onClick={() => { 
                      setActiveChannelId(ch.id); 
                      setActiveDmUser(null);
                      setShowChannelMenu(false);
                      setShowMobileSidebar(false);
                    }} 
                    className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-all group border touch-manipulation relative ${!activeDmUser && activeChannelId === ch.id ? 'bg-[var(--accent)] text-white shadow-lg border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border-transparent'}`}
                  >
                    <ch.icon size={14} className="md:w-4 md:h-4 shrink-0" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-tight flex-1 text-left truncate">{ch.name}</span>
                    {isBroadcast && (
                      <Radio size={10} className="md:w-3 md:h-3 shrink-0" />
                    )}
                    {unreadCount > 0 && (
                      <span className={`flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-[10px] md:text-[11px] font-black shrink-0 z-10 ${!activeDmUser && activeChannelId === ch.id ? 'bg-white text-[var(--accent)]' : 'bg-[var(--accent)] text-white shadow-lg'}`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 px-2">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Members</p>
            </div>
            <div className="space-y-0.5 md:space-y-1">
              {allUsers.map(u => {
                const threadId = [userProfile?.id || '', u.id].sort().join('_');
                const unreadCount = unreadCounts[threadId] || 0;
                return (
                <button 
                  key={u.id} 
                  onClick={() => {
                    setActiveDmUser(u);
                    setShowMobileSidebar(false);
                  }} 
                  className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-all group relative border touch-manipulation ${activeDmUser?.id === u.id ? 'bg-[var(--accent)] text-white shadow-lg border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] border-transparent'}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center text-[10px] md:text-xs font-black uppercase overflow-hidden text-[var(--accent)]">
                      {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover"/> : u.fullName.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full border-2 border-[var(--bg-card)] ${u.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-[var(--text-secondary)]'}`} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] md:text-xs font-black uppercase truncate leading-none">{u.fullName}</p>
                    <p className={`text-[7px] font-bold uppercase tracking-widest mt-0.5 ${activeDmUser?.id === u.id ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                      {u.status === 'ONLINE' ? 'READY' : formatLastSeen(u.lastSeen)}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`flex items-center justify-center min-w-[24px] h-[24px] px-1.5 rounded-full text-[10px] md:text-[11px] font-black shrink-0 z-10 shadow-lg ${activeDmUser?.id === u.id ? 'bg-white text-[var(--accent)]' : 'bg-[var(--accent)] text-white'}`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[var(--bg-card)] overflow-hidden min-h-0" ref={dropZoneRef}>
        <header className="h-14 md:h-16 lg:h-20 border-b border-[var(--border-ui)] flex items-center justify-between px-3 md:px-4 lg:px-8 bg-[var(--bg-card)] sticky top-0 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-5 min-w-0 flex-1">
             {/* Mobile Menu Button */}
             <button
               onClick={() => setShowMobileSidebar(true)}
               className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-all"
             >
               <Users size={20} />
             </button>
             
             <div className="relative shrink-0">
               <div className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-2xl text-[var(--accent)] flex items-center justify-center shadow-inner">
                  {activeDmUser ? <User size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5"/> : <Hash size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5"/>}
               </div>
               {activeDmUser?.status === 'ONLINE' && <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] shadow-lg animate-pulse" />}
             </div>
             <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 md:gap-3">
                   <h2 className="text-xs md:text-sm lg:text-base font-black uppercase text-[var(--text-primary)] tracking-tight truncate">
                     {activeDmUser 
                       ? activeDmUser.fullName 
                       : (channels.find(c => c.id === activeChannelId)?.name || activeChannelId)}
                   </h2>
                </div>
                <p className="text-[7px] md:text-[8px] lg:text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em] mt-0.5 truncate flex items-center gap-2">
                  {activeDmUser 
                    ? (activeDmUser.status === 'ONLINE' ? 'ONLINE' : formatLastSeen(activeDmUser.lastSeen)) 
                    : (
                      <>
                        {currentChannel?.type === 'broadcast' && <Radio size={10} />}
                        <span>{currentChannel?.description || channels.find(c => c.id === activeChannelId)?.description || 'Channel'}</span>
                        {currentChannel?.type === 'broadcast' && <span className="text-[7px]">• BROADCAST</span>}
                      </>
                    )}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5 shrink-0 ml-1 md:ml-2 relative">
             <button 
               onClick={() => setShowSearch(!showSearch)}
               className="p-1.5 md:p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
               title="Search messages"
             >
               <Search size={14} className="md:w-[14px] md:h-[14px]"/>
             </button>
             {!activeDmUser && (
               <div className="relative" ref={menuRef}>
                 <button 
                   onClick={() => setShowChannelMenu(!showChannelMenu)}
                   className="p-1.5 md:p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
                   title="Channel options"
                 >
                   <MoreVertical size={14} className="md:w-[14px] md:h-[14px]"/>
                 </button>
                 {showChannelMenu && !activeDmUser && (
                   <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-2xl z-50 animate-pop-in overflow-hidden">
                     {currentChannel && (currentChannel.createdBy === userProfile?.id || isOwner) && !CHANNELS.find(c => c.id === currentChannel.id) && (
                       <>
                         <button
                           onClick={() => {
                             setEditingChannelName(currentChannel.name);
                             setEditingChannelDesc(currentChannel.description);
                             setShowEditChannel(true);
                             setShowChannelMenu(false);
                           }}
                           className="w-full px-4 py-3 text-left text-sm font-black uppercase text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] transition-colors flex items-center gap-3"
                         >
                           <Pencil size={16} />
                           Edit Group
                         </button>
                         <div className="border-t border-[var(--border-ui)]" />
                       </>
                     )}
                     {currentChannel && currentChannel.createdBy === userProfile?.id && !CHANNELS.find(c => c.id === currentChannel.id) && (
                       <>
                         <button
                           onClick={() => {
                             setChannelToDelete(activeChannelId);
                             setShowChannelMenu(false);
                           }}
                           className="w-full px-4 py-3 text-left text-sm font-black uppercase text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-3"
                         >
                           <Trash2 size={16} />
                           Delete Group
                         </button>
                         <div className="border-t border-[var(--border-ui)]" />
                       </>
                     )}
                     {currentChannel && currentChannel.memberIds && currentChannel.memberIds.length > 0 && (
                       <>
                         <button
                           onClick={() => {
                             setShowRemoveMember(true);
                             setShowChannelMenu(false);
                           }}
                           className="w-full px-4 py-3 text-left text-sm font-black uppercase text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] transition-colors flex items-center gap-3"
                         >
                           <Users size={16} />
                           Manage Members
                         </button>
                         <div className="border-t border-[var(--border-ui)]" />
                       </>
                     )}
                     <div className="p-3 text-xs text-[var(--text-secondary)] font-bold uppercase">
                       {currentChannel?.id === 'General' 
                         ? `${allUsers.length + 1} Members (All)`
                         : `${currentChannel?.memberIds?.length || 0} Members`}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        </header>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-3 md:px-4 lg:px-8 py-2 md:py-3 border-b border-[var(--border-ui)] bg-[var(--bg-card-muted)] animate-enter">
            <div className="flex items-center gap-2 md:gap-3">
              <Search size={16} className="md:w-[18px] md:h-[18px] text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-[var(--text-secondary)]">
                {filteredMessages.length} result(s)
              </div>
            )}
          </div>
        )}

        <div 
          ref={scrollRef} 
          className="team-chat-messages flex-1 overflow-y-auto p-2 md:p-4 lg:p-8 pb-32 md:pb-20 lg:pb-24 space-y-2 md:space-y-4 lg:space-y-6 custom-scroll bg-[var(--bg-canvas)]/30 relative min-h-0"
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
            setShowScrollToBottom(!isNearBottom && messages.length > 0);
            
            // Mark as read when scrolling to bottom
            if (isNearBottom && unreadMessageIndex !== null) {
              const now = Date.now();
              setLastReadTimestamps((prev: Record<string, number>) => {
                const newTimestamps = { ...prev, [currentThreadId]: now };
                localStorage.setItem('team_chat_last_read', JSON.stringify(newTimestamps));
                return newTimestamps;
              });
              setUnreadCounts((prev: Record<string, number>) => ({ ...prev, [currentThreadId]: 0 }));
              setUnreadMessageIndex(null);
            }
          }}
        >
          {/* Drag and Drop Overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-[var(--accent)]/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-[var(--accent)] rounded-2xl m-4">
              <div className="text-center">
                <Paperclip size={48} className="mx-auto mb-4 text-[var(--accent)]" />
                <p className="text-lg font-black text-[var(--text-primary)] uppercase">Drop files here</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Release to upload</p>
              </div>
            </div>
          )}

          {/* Unread Message Indicator (WhatsApp-style) - Only show if there are unread messages */}
          {unreadMessageIndex !== null && unreadMessageIndex >= 0 && messages.length > unreadMessageIndex && unreadMessageIndex < messages.length - 1 && (
            <div className="sticky top-4 z-10 flex justify-center mb-4 animate-pop-in">
              <button
                onClick={() => {
                  if (scrollRef.current) {
                    const msgElements = scrollRef.current.querySelectorAll('[data-msg-index]');
                    const targetElement = Array.from(msgElements).find((el: any) => 
                      parseInt(el.getAttribute('data-msg-index')) === unreadMessageIndex
                    ) as HTMLElement;
                    if (targetElement) {
                      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-full shadow-lg hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black uppercase"
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {messages.length - unreadMessageIndex} {messages.length - unreadMessageIndex === 1 ? 'NEW MESSAGE' : 'NEW MESSAGES'}
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          {/* Scroll to Bottom Button (WhatsApp-style) */}
          {showScrollToBottom && (
            <div className="fixed bottom-24 md:bottom-28 right-4 md:right-8 z-30 animate-pop-in">
              <button
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                  }
                }}
                className="w-10 h-10 md:w-12 md:h-12 bg-[var(--accent)] text-white rounded-full shadow-lg hover:brightness-110 transition-all flex items-center justify-center"
                title="Scroll to bottom"
              >
                <ChevronDown size={20} className="md:w-6 md:h-6" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
              <Loader2 className="animate-spin text-[var(--accent)]" size={40}/>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Hydrating Thread...</p>
            </div>
          ) : (
            <>

              {filteredMessages.map((msg, i) => {
                const isMe = msg.senderId === userProfile.id;
                const showHead = i === 0 || filteredMessages[i-1].senderId !== msg.senderId || (filteredMessages[i-1].timestamp?.toMillis() && msg.timestamp?.toMillis() && msg.timestamp.toMillis() - filteredMessages[i-1].timestamp.toMillis() > 300000);
                const isDeleted = (msg as any).deletedFor?.includes?.(userProfile.id);
                
                return (
                  <div
                    key={msg.id}
                    data-msg-index={i}
                    className={`flex gap-2 md:gap-3 lg:gap-4 ${isMe ? 'flex-row-reverse' : ''} ${showHead ? 'mt-2 md:mt-3' : 'mt-0.5 md:mt-1'} group/msg animate-enter`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-xl bg-[var(--bg-card-muted)] overflow-hidden flex items-center justify-center border border-[var(--border-ui)] shadow-lg shrink-0 transition-all ${!showHead ? 'opacity-0 scale-75 pointer-events-none' : ''}`}>
                      {msg.senderAvatar ? <img src={msg.senderAvatar} className="w-full h-full object-cover" /> : <span className="text-[9px] font-black text-[var(--accent)]">{msg.senderName.charAt(0)}</span>}
                    </div>
                    
                    <div className={`max-w-[80%] md:max-w-[85%] lg:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showHead && (
                        <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] lg:text-[10px] font-black uppercase text-[var(--text-primary)] tracking-tight truncate">{msg.senderName}</span>
                          <span className="text-[8px] lg:text-[9px] font-bold text-[var(--text-secondary)] tabular-nums opacity-60">
                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                          </span>
                        </div>
                      )}
                      
                      <div className="relative group/msg-bubble">
                        {isDeleted ? (
                          <div className="p-3 lg:p-4 rounded-xl text-sm lg:text-[14px] italic text-[var(--text-secondary)] opacity-50">
                            This message was deleted
                          </div>
                        ) : editingMsg?.id === msg.id ? (
                          <div className="p-3 lg:p-4 rounded-xl bg-[var(--bg-card-muted)] border-2 border-[var(--accent)]">
                            <textarea
                              value={editingMsg.text}
                              onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })}
                              className="w-full bg-transparent text-[var(--text-primary)] text-sm resize-none outline-none mb-2"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setEditingMsg(null)}
                                className="px-3 py-1.5 text-xs font-black uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveEdit}
                                className="px-3 py-1.5 text-xs font-black uppercase bg-[var(--accent)] text-white rounded-lg hover:brightness-110 transition-all"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                        <div className={`
                              ${msg.text ? 'p-2.5 md:p-3 lg:p-4' : 'p-0'} rounded-xl lg:rounded-2xl text-xs md:text-sm lg:text-[14px] font-medium leading-relaxed shadow-sm transition-all
                          ${isMe 
                                ? msg.text ? 'bg-[var(--accent)] text-white rounded-tr-sm' : 'bg-transparent'
                                : msg.text ? 'bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-ui)]' : 'bg-transparent'}
                            `}>
                              {msg.text && (
                                <div className="break-words">
                                  {msg.text}
                                  {(msg as any).isEdited && (
                                    <span className="ml-2 text-[10px] opacity-60 italic">(edited)</span>
                                  )}
                                </div>
                              )}
                          {renderFileContent(msg)}
                          {/* Link Preview in Message */}
                          {(msg as any).linkPreview && (
                            <div className="mt-2 max-w-full md:max-w-sm">
                              <a 
                                href={(msg as any).linkPreview.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl overflow-hidden hover:border-[var(--accent)]/50 transition-all group"
                              >
                                {(msg as any).linkPreview.image && (
                                  <div className="w-full h-32 md:h-40 overflow-hidden bg-[var(--bg-card)]">
                                    <img 
                                      src={(msg as any).linkPreview.image} 
                                      alt={(msg as any).linkPreview.title || 'Link preview'} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                        </div>
                                )}
                                <div className="p-2.5 md:p-3">
                                  {(msg as any).linkPreview.siteName && (
                                    <p className="text-[8px] md:text-[9px] text-[var(--text-secondary)] uppercase font-black mb-1">
                                      {(msg as any).linkPreview.siteName}
                                    </p>
                                  )}
                                  {(msg as any).linkPreview.title && (
                                    <p className="text-xs md:text-sm font-black text-[var(--text-primary)] line-clamp-2 mb-1">
                                      {(msg as any).linkPreview.title}
                                    </p>
                                  )}
                                  {(msg as any).linkPreview.description && (
                                    <p className="text-[10px] md:text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
                                      {(msg as any).linkPreview.description}
                                    </p>
                                  )}
                                  <p className="text-[9px] md:text-[10px] text-[var(--accent)] truncate">
                                    {(msg as any).linkPreview.url}
                                  </p>
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                            {isMe && (msg.text || msg.fileUrl || (msg as any).linkPreview) && (
                              <>
                                {/* Desktop: Hover buttons */}
                                <div className={`hidden md:flex absolute ${isMe ? '-left-20' : '-right-20'} top-1/2 -translate-y-1/2 gap-1 opacity-0 group-hover/msg-bubble:opacity-100 transition-opacity z-10`}>
                                  {msg.text && (
                                    <>
                                      <button 
                                        onClick={() => handleEditClick(msg.id, msg.text)}
                                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-all"
                                        title="Edit message"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      {(msg as any).isEdited && (
                                        <button 
                                          onClick={() => viewEditHistory(msg.id)}
                                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-all"
                                          title="View edit history"
                                        >
                                          <History size={14} />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteClick(msg.id, msg.text, msg.fileName)}
                                    className="p-2 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--bg-card-muted)] rounded-lg transition-all"
                                    title="Unsend message"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                {/* Mobile: Long-press handler (invisible, just for touch events) */}
                                <div
                                  className="md:hidden absolute inset-0 z-0"
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                    longPressTargetRef.current = msg.id;
                                    longPressTimerRef.current = setTimeout(() => {
                                      if (longPressTargetRef.current === msg.id) {
                                        const touch = e.touches[0];
                                        if (touch) {
                                          setLongPressMenu({
                                            msgId: msg.id,
                                            x: touch.clientX,
                                            y: touch.clientY,
                                            msgText: msg.text,
                                            fileName: msg.fileName,
                                            isEdited: (msg as any).isEdited
                                          });
                                        }
                                        longPressTargetRef.current = null;
                                      }
                                    }, 500);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    if (longPressTimerRef.current) {
                                      clearTimeout(longPressTimerRef.current);
                                      longPressTimerRef.current = null;
                                    }
                                    if (longPressTargetRef.current === msg.id) {
                                      longPressTargetRef.current = null;
                                    }
                                  }}
                                  onTouchMove={(e) => {
                                    e.stopPropagation();
                                    if (longPressTimerRef.current) {
                                      clearTimeout(longPressTimerRef.current);
                                      longPressTimerRef.current = null;
                                    }
                                    longPressTargetRef.current = null;
                                  }}
                                  onTouchCancel={(e) => {
                                    e.stopPropagation();
                                    if (longPressTimerRef.current) {
                                      clearTimeout(longPressTimerRef.current);
                                      longPressTimerRef.current = null;
                                    }
                                    longPressTargetRef.current = null;
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            </>
          )}
          
          {/* Typing indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-3 lg:gap-4 animate-enter ml-1">
              <div className="flex gap-1 p-2 lg:p-3 bg-[var(--bg-card-muted)] rounded-xl border border-[var(--border-ui)]">
                <span className="w-1 h-1 bg-[var(--accent)] rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-1 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
              <span className="text-[8px] lg:text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                {typingUsers.length === 1 ? `${typingUsers[0].toUpperCase()} IS TYPING...` : 'MULTIPLE PEOPLE TYPING...'}
              </span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <footer className="team-chat-footer p-2 md:p-4 lg:p-6 bg-[var(--bg-card)] border-t border-[var(--border-ui)] sticky z-[2010] shrink-0 flex flex-col shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none">
          <div className="max-w-5xl mx-auto space-y-2 md:space-y-3 relative flex flex-col w-full">
            {/* Link Preview */}
            {linkPreview && (
              <div className="bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl p-3 animate-enter shrink-0">
                <div className="flex items-start gap-3 p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-ui)]">
                  {linkPreview.image && (
                    <img 
                      src={linkPreview.image} 
                      alt={linkPreview.title || 'Link preview'} 
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {linkPreview.siteName && (
                      <p className="text-[9px] text-[var(--text-secondary)] uppercase font-black mb-1">{linkPreview.siteName}</p>
                    )}
                    {linkPreview.title && (
                      <p className="text-xs font-black text-[var(--text-primary)] line-clamp-2 mb-1">{linkPreview.title}</p>
                    )}
                    {linkPreview.description && (
                      <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mb-2">{linkPreview.description}</p>
                    )}
                    <a 
                      href={linkPreview.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] text-[var(--accent)] hover:underline truncate block"
                    >
                      {linkPreview.url}
                    </a>
                 </div>
                  <button
                    onClick={() => setLinkPreview(null)}
                    className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
                    title="Remove preview"
                  >
                    <X size={16} />
                  </button>
                    </div>
                    </div>
            )}

            {/* Pending Files Preview - Teams-like in input area with max height and scroll */}
            {pendingFiles.length > 0 && (
              <div className="bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl p-3 max-h-28 lg:max-h-36 overflow-y-auto custom-scroll animate-enter shrink-0">
                <div className="space-y-2">
                  {pendingFiles.map((pending) => (
                    <div key={pending.id} className="flex items-center gap-3 p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-ui)] shrink-0">
                      {/* Preview/Icon */}
                      {pending.file.type.startsWith('image/') && pending.preview ? (
                        <img src={pending.preview} alt="Preview" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      ) : pending.file.type.startsWith('video/') && pending.preview ? (
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-card-muted)] flex items-center justify-center shrink-0 relative overflow-hidden">
                          <video src={pending.preview} className="w-full h-full object-cover" />
                          <Video className="absolute text-white/80" size={16} />
                 </div>
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl shrink-0">
                          {React.createElement(getFileIcon(pending.file.type), { size: 20 })}
                    </div>
                      )}
                      
                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-[var(--text-primary)] truncate">{pending.file.name}</p>
                        <p className="text-[9px] text-[var(--text-secondary)]">{formatFileSize(pending.file.size)}</p>
                        {/* Individual Progress Bar - only show when uploading */}
                        {pending.uploading && pending.progress !== undefined && (
                          <div className="mt-1.5 h-1 bg-[var(--bg-card-muted)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[var(--accent)] transition-all duration-300" 
                              style={{ width: `${Math.max(1, Math.min(100, pending.progress))}%` }} 
                            />
                    </div>
                        )}
                        {!pending.uploading && pending.progress === 100 && !pending.error && (
                          <p className="text-[9px] text-green-500 mt-1">✓ Upload complete</p>
                        )}
                        {pending.error && (
                          <p className="text-[9px] text-rose-500 mt-1">{pending.error}</p>
                        )}
                 </div>
                      
                      {/* Delete Button */}
                      {!pending.uploading && (
                        <button
                          onClick={() => removePendingFile(pending.id)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
                          title="Remove file"
                        >
                          <X size={16} />
                 </button>
                      )}
                      {pending.uploading && (
                        <Loader2 className="animate-spin text-[var(--accent)] shrink-0" size={16} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className={`relative bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-xl lg:rounded-2xl flex items-center p-1 md:p-1.5 lg:p-2 shadow-lg group focus-within:border-[var(--accent)]/50 transition-all min-w-0 overflow-visible ${!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner ? 'opacity-60' : ''}`}>
               <div className="flex items-center justify-center shrink-0 relative self-stretch py-1">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner}
                    className="h-full flex items-center justify-center px-1.5 md:px-2 lg:px-2.5 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                    title="Attach File"
                  >
                    <Paperclip size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5"/>
                  </button>
                  <div className="relative z-50 self-stretch" ref={emojiRef}>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      disabled={!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner}
                      className={`h-full flex items-center justify-center px-1.5 md:px-2 lg:px-2.5 transition-all rounded-xl ${showEmojiPicker ? 'text-[var(--accent)] bg-[var(--bg-card)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Smile size={16} className="md:w-[18px] md:h-[18px] lg:w-5 lg:h-5"/>
                    </button>
                    {showEmojiPicker && (
                      <div className="fixed md:absolute bottom-16 md:bottom-full left-2 md:left-0 mb-0 md:mb-2 bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-2xl z-[100] w-[calc(100vw-1rem)] md:w-[360px] max-h-[50vh] md:max-h-[420px] overflow-hidden flex flex-col animate-pop-in">
                        {/* Header with Search */}
                        <div className="p-3 border-b border-[var(--border-ui)] shrink-0">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black uppercase text-[var(--text-primary)]">Emoji</span>
                            <button
                              onClick={() => {
                                setShowEmojiPicker(false);
                                setEmojiSearchQuery('');
                              }}
                              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                            <input
                              type="text"
                              value={emojiSearchQuery}
                              onChange={(e) => setEmojiSearchQuery(e.target.value)}
                              placeholder="Search emojis..."
                              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            />
                          </div>
                        </div>

                        <div className="flex flex-1 min-h-0">
                          {/* Sidebar Categories */}
                          <div className="w-12 border-r border-[var(--border-ui)] bg-[var(--bg-card-muted)] flex flex-col items-center py-2 shrink-0">
                            {Object.keys(EMOJI_CATEGORIES).map((category) => {
                              const categoryIcons: Record<string, any> = {
                                'Smileys & People': Smile,
                                'Gestures & Body': UsersIcon,
                                'Activities': Radio,
                                'Objects': Monitor,
                                'Symbols': Heart
                              };
                              const Icon = categoryIcons[category] || Sparkles;
                              const isActive = selectedEmojiCategory === category;
                              
                              return (
                                <button
                                  key={category}
                                  onClick={() => {
                                    setSelectedEmojiCategory(category);
                                    emojiCategoryRefs.current[category]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg mb-1 transition-all ${
                                    isActive
                                      ? 'bg-[var(--accent)] text-white'
                                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
                                  }`}
                                  title={category}
                                >
                                  <Icon size={16} />
                                </button>
                              );
                            })}
                          </div>

                          {/* Main Emoji Grid */}
                          <div className="flex-1 overflow-y-auto custom-scroll">
                            {(() => {
                              // Search functionality with keyword matching
                              const query = emojiSearchQuery.toLowerCase().trim();
                              let searchResults: Array<{category: string, emojis: string[]}> = [];
                              
                              if (query) {
                                // Search mode: find matching emojis across all categories
                                Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]: [string, string[]]) => {
                                  const matching = emojis.filter(emoji => {
                                    // Check category name
                                    if (category.toLowerCase().includes(query)) return true;
                                    // Check emoji keywords
                                    const keywords = EMOJI_KEYWORDS[emoji] || [];
                                    if (keywords.some(kw => kw.includes(query))) return true;
                                    return false;
                                  });
                                  if (matching.length > 0) {
                                    searchResults.push({ category, emojis: matching });
                                  }
                                });
                              } else {
                                // No search: show all categories
                                searchResults = Object.entries(EMOJI_CATEGORIES).map(([category, emojis]: [string, string[]]) => ({
                                  category,
                                  emojis
                                }));
                              }

                              if (searchResults.length === 0 && query) {
                                return (
                                  <div className="p-8 text-center">
                                    <p className="text-xs text-[var(--text-secondary)]">No emojis found</p>
                                    <p className="text-[9px] text-[var(--text-secondary)] mt-1">Try: happy, heart, thumbs, love, sad, etc.</p>
                                  </div>
                                );
                              }

                              return searchResults.map(({ category, emojis: filteredEmojis }) => (
                                <div
                                  key={category}
                                  ref={(el) => {
                                    if (el) emojiCategoryRefs.current[category] = el;
                                  }}
                                  className="mb-6 scroll-mt-2"
                                >
                                  {/* Section Heading */}
                                  <div className="sticky top-0 bg-[var(--bg-card)] z-10 px-3 py-2 border-b border-[var(--border-ui)] mb-2">
                                    <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest">
                                      {category}
                                    </p>
                                  </div>
                                  
                                  {/* Emoji Grid */}
                                  <div className="px-3 grid grid-cols-8 gap-1">
                                    {filteredEmojis.map((emoji: string, idx: number) => (
                                      <button
                                        key={`${category}-${idx}`}
                                        onClick={() => {
                                          setInput(prev => prev + emoji);
                                          if (emojiSearchQuery) {
                                            setEmojiSearchQuery('');
                                          }
                                        }}
                                        className="w-9 h-9 flex items-center justify-center hover:bg-[var(--bg-card-muted)] rounded-lg transition-all text-lg active:scale-90 hover:scale-110"
                                        title={emoji}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>

               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleFileUpload}
                 accept="*"
                 multiple
               />
               <input 
                 type="file" 
                 ref={largeFileInputRef} 
                 className="hidden" 
                 onChange={(e) => {
                   const files = e.target.files;
                   if (files && files.length > 0) {
                     handleFiles(Array.from(files), true);
                   }
                 }}
                 accept="*"
               />
               
               <form 
                 onSubmit={e => { e.preventDefault(); sendMessage(input); }} 
                 className="flex-1 flex items-center min-w-0"
               >
                 <input 
                   value={input} 
                   onChange={handleInputChange} 
                   disabled={!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner}
                   placeholder={
                     !activeDmUser && currentChannel?.type === 'broadcast' && !isOwner
                       ? 'Only admins can post'
                       : `Message ${activeDmUser ? activeDmUser.fullName.split(' ')[0] : (channels.find(c => c.id === activeChannelId)?.name || currentChannel?.name || activeChannelId)}...`
                   }
                   className="flex-1 bg-transparent border-none outline-none px-2 md:px-3 lg:px-4 text-xs md:text-sm lg:text-[14px] font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" 
                 />
                 <button 
                  type="submit" 
                  disabled={(!input.trim() && pendingFiles.length === 0 && !linkPreview) || (!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner) || pendingFiles.some(f => f.uploading)} 
                  className={`
                    h-8 md:h-9 lg:h-11 px-3 md:px-4 lg:px-6 bg-[var(--accent)] text-white rounded-lg md:rounded-xl flex items-center justify-center gap-1 md:gap-2 shrink-0
                    hover:brightness-110 hover:shadow-lg
                    disabled:opacity-20 disabled:grayscale transition-all active:scale-95 ml-1 md:ml-1 lg:ml-2
                  `}
                  title={!activeDmUser && currentChannel?.type === 'broadcast' && !isOwner ? 'Only admins can post in broadcast channels' : 'Send message'}
                 >
                   <Send size={14} className="md:w-[14px] md:h-[14px] lg:w-4 lg:h-4 shrink-0" />
                   <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] hidden md:inline">Send</span>
                 </button>
               </form>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-[var(--text-secondary)] pointer-events-none opacity-30 grayscale hidden sm:flex">
               <Shield size={10}/>
               <span className="text-[7px] font-black uppercase tracking-[0.4em]">AES-256 Scoped Link Active</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Long-Press Menu */}
      {longPressMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[2020] md:hidden"
            onClick={() => {
              setLongPressMenu(null);
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            }}
            onTouchStart={() => {
              setLongPressMenu(null);
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            }}
          />
          <div 
            className="fixed md:hidden bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-xl shadow-2xl z-[2021] py-2 min-w-[200px] animate-pop-in"
            style={{
              left: `${Math.max(10, Math.min(longPressMenu.x - 100, window.innerWidth - 210))}px`,
              top: `${Math.max(10, Math.min(longPressMenu.y - 80, window.innerHeight - 200))}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {longPressMenu.msgText && (
              <>
                <button
                  onClick={() => {
                    handleEditClick(longPressMenu.msgId, longPressMenu.msgText || '');
                    setLongPressMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-card-muted)] active:bg-[var(--bg-card-muted)] transition-colors touch-manipulation"
                >
                  <Pencil size={18} className="text-[var(--text-secondary)] shrink-0" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Edit</span>
                </button>
                {longPressMenu.isEdited && (
                  <button
                    onClick={() => {
                      viewEditHistory(longPressMenu.msgId);
                      setLongPressMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-card-muted)] active:bg-[var(--bg-card-muted)] transition-colors touch-manipulation border-t border-[var(--border-ui)]"
                  >
                    <History size={18} className="text-[var(--text-secondary)] shrink-0" />
                    <span className="text-sm font-semibold text-[var(--text-primary)]">View History</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => {
                handleDeleteClick(longPressMenu.msgId, longPressMenu.msgText, longPressMenu.fileName);
                setLongPressMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-500/10 active:bg-rose-500/10 transition-colors touch-manipulation border-t border-[var(--border-ui)]"
            >
              <Trash2 size={18} className="text-rose-500 shrink-0" />
              <span className="text-sm font-semibold text-rose-500">Delete</span>
            </button>
          </div>
        </>
      )}

      {/* Full Screen Media Carousel - Using Portal to render outside DOM hierarchy */}
      {viewingImage && mediaCarousel.length > 0 && createPortal(
        <div
          className="exec-modal-overlay animate-fade-in"
          onClick={() => setViewingImage(null)}
          style={{ zIndex: 99999 }}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-3 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] rounded-full text-[var(--text-primary)] border border-[var(--border-ui)] transition-all z-10 shadow-lg backdrop-blur-sm hover:scale-110 active:scale-95"
            >
              <X size={24} />
            </button>

            {/* Previous Button */}
            {mediaCarousel.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousMedia();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] rounded-full text-[var(--text-primary)] border border-[var(--border-ui)] transition-all z-10 shadow-lg backdrop-blur-sm hover:scale-110 active:scale-95"
                title="Previous (←)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next Button */}
            {mediaCarousel.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextMedia();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] rounded-full text-[var(--text-primary)] border border-[var(--border-ui)] transition-all z-10 shadow-lg backdrop-blur-sm hover:scale-110 active:scale-95"
                title="Next (→)"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Media Display */}
            <div className="max-w-full max-h-full flex items-center justify-center relative overflow-hidden">
              <div key={currentMediaIndex} className={`flex items-center justify-center ${slideDirection === 'left' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
                {mediaCarousel[currentMediaIndex]?.type?.startsWith('image/') ? (
                  <img 
                    src={mediaCarousel[currentMediaIndex].url} 
                    alt={mediaCarousel[currentMediaIndex].name || 'Image'}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : mediaCarousel[currentMediaIndex]?.type?.startsWith('video/') ? (
                  <video 
                    src={mediaCarousel[currentMediaIndex].url} 
                    controls
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    autoPlay
                  />
                ) : null}
              </div>

                {/* Media Counter */}
                {mediaCarousel.length > 1 && (
                  <div className="absolute top-4 left-4 px-4 py-2 bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-lg text-[var(--text-primary)] border border-[var(--border-ui)] shadow-lg text-sm font-black">
                    {currentMediaIndex + 1} / {mediaCarousel.length}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = mediaCarousel[currentMediaIndex].url;
                      a.download = mediaCarousel[currentMediaIndex].name || 'media';
                      a.click();
                    }}
                    className="px-4 py-2 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)] border border-[var(--border-ui)] flex items-center gap-2 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                  >
                    <Download size={18} />
                    Download
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(mediaCarousel[currentMediaIndex].url, '_blank');
                    }}
                    className="px-4 py-2 bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] rounded-lg text-[var(--text-primary)] border border-[var(--border-ui)] flex items-center gap-2 transition-all shadow-lg backdrop-blur-sm hover:scale-105 active:scale-95"
                  >
                    <ExternalLink size={18} />
                    Open
                  </button>
                </div>
              </div>
            </div>
        </div>,
        document.body
      )}

      {/* Large File Share Modal */}
      {showFileShare && shareFile && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-md w-full mx-4 md:mx-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Share Large File</h3>
              <button
                onClick={() => {
                  setShowFileShare(false);
                  setShareFile(null);
                  setShareLink(null);
                  setUploadProgress(null);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--bg-card-muted)] rounded-xl">
                {React.createElement(getFileIcon(shareFile.type), { size: 24, className: "text-[var(--accent)]" })}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[var(--text-primary)] truncate">{shareFile.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{formatFileSize(shareFile.size)}</p>
                </div>
              </div>

              {uploadProgress !== null && (
                <div className="space-y-2">
                  <div className="h-2 bg-[var(--bg-card-muted)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] text-center">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              {shareLink ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl border border-[var(--border-ui)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-2">Share Link:</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-[var(--text-primary)] border-none outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          showToast('Link copied to clipboard');
                        }}
                        className="p-2 text-[var(--accent)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
                      >
                        <Link2 size={18} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowFileShare(false);
                      setShareFile(null);
                      setShareLink(null);
                      setUploadProgress(null);
                    }}
                    className="w-full px-4 py-2 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLargeFileShare}
                  disabled={uploadProgress !== null}
                  className="w-full px-4 py-3 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadProgress !== null ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Share2 size={16} />
                      Generate Share Link
                    </>
                  )}
                </button>
              )}
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-md w-full mx-4 md:mx-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Unsend Message</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {(deleteConfirm.msgText || deleteConfirm.fileName) && (
                <div className="p-3 bg-[var(--bg-card-muted)] rounded-xl border border-[var(--border-ui)]">
                  {deleteConfirm.msgText && (
                    <>
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Message:</p>
                      <p className="text-sm text-[var(--text-primary)]">{deleteConfirm.msgText}</p>
                    </>
                  )}
                  {deleteConfirm.fileName && !deleteConfirm.msgText && (
                    <>
                      <p className="text-xs text-[var(--text-secondary)] mb-1">File:</p>
                      <p className="text-sm text-[var(--text-primary)]">{deleteConfirm.fileName}</p>
                    </>
                  )}
                </div>
              )}

              <p className="text-sm text-[var(--text-secondary)]">
                How would you like to delete this message?
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => setDeleteForEveryone(true)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    deleteForEveryone 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                      : 'border-[var(--border-ui)] bg-[var(--bg-card-muted)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      deleteForEveryone 
                        ? 'border-[var(--accent)] bg-[var(--accent)]' 
                        : 'border-[var(--border-ui)]'
                    }`}>
                      {deleteForEveryone && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)]">Delete for everyone</p>
                      <p className="text-xs text-[var(--text-secondary)]">Removes the message for all participants</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setDeleteForEveryone(false)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    !deleteForEveryone 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                      : 'border-[var(--border-ui)] bg-[var(--bg-card-muted)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !deleteForEveryone 
                        ? 'border-[var(--accent)] bg-[var(--accent)]' 
                        : 'border-[var(--border-ui)]'
                    }`}>
                      {!deleteForEveryone && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-primary)]">Delete for me</p>
                      <p className="text-xs text-[var(--text-secondary)]">Only removes the message from your view</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-xl font-black uppercase text-sm hover:bg-[var(--bg-card)] transition-all border border-[var(--border-ui)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMessage(deleteConfirm.msgId, deleteForEveryone)}
                  className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-black uppercase text-sm hover:bg-rose-600 transition-all shadow-lg"
                >
                  {deleteForEveryone ? 'Delete for Everyone' : 'Delete for Me'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit History Modal */}
      {editHistory && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-2xl w-full mx-4 md:mx-auto max-h-[80vh] overflow-y-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Edit History</h3>
              <button
                onClick={() => setEditHistory(null)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {editHistory.history.map((entry: any, index: number) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    entry.isCurrent 
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                      : entry.isOriginal
                      ? 'border-[var(--border-ui)] bg-[var(--bg-card-muted)]'
                      : 'border-[var(--border-ui)]/50 bg-[var(--bg-card-muted)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.isOriginal && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[var(--accent)]/20 text-[var(--accent)] rounded">Original</span>
                      )}
                      {entry.isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[var(--accent)] text-white rounded">Current</span>
                      )}
                      {!entry.isOriginal && !entry.isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-[var(--text-secondary)]/20 text-[var(--text-secondary)] rounded">Edit #{index}</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {entry.editedAt?.toDate ? entry.editedAt.toDate().toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{entry.text}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && isOwner && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-2xl w-full mx-4 md:mx-auto max-h-[85vh] overflow-y-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Create Group Channel</h3>
              <button
                onClick={() => {
                  setShowCreateChannel(false);
                  setNewChannelName('');
                  setNewChannelDesc('');
                  setNewChannelType('standard');
                  setSelectedChannelUsers([]);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., Marketing, Sales, Support"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Description (Optional)</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel for?"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Channel Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewChannelType('standard')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      newChannelType === 'standard'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border-ui)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Hash size={20} className={newChannelType === 'standard' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                      <span className={`text-sm font-black uppercase ${newChannelType === 'standard' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>Standard</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">All members can post</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewChannelType('broadcast')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      newChannelType === 'broadcast'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--border-ui)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Radio size={20} className={newChannelType === 'broadcast' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                      <span className={`text-sm font-black uppercase ${newChannelType === 'broadcast' ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>Broadcast</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">Only admins can post</p>
                  </button>
                </div>
                {newChannelType === 'broadcast' && (
                  <p className="text-[9px] text-[var(--text-secondary)] mt-2 italic">
                    Perfect for HR announcements. All members can read, only admins can post.
                  </p>
                )}
              </div>

              {newChannelType === 'standard' && (
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Select Members ({selectedChannelUsers.length} selected)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll border border-[var(--border-ui)] rounded-xl p-2 bg-[var(--bg-card-muted)]">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedChannelUsers(prev => 
                          prev.includes(user.id) 
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedChannelUsers.includes(user.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--border-ui)]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedChannelUsers.includes(user.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-ui)]'
                      }`}>
                        {selectedChannelUsers.includes(user.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center text-xs font-black uppercase overflow-hidden text-[var(--accent)] shrink-0">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : user.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate">{user.fullName}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.role}</p>
                      </div>
                    </button>
                  ))}
                  {allUsers.length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)] text-center py-4">No users available</p>
                  )}
                </div>
              </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateChannel(false);
                    setNewChannelName('');
                    setNewChannelDesc('');
                    setNewChannelType('standard');
                    setSelectedChannelUsers([]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-xl font-black uppercase text-sm hover:bg-[var(--bg-card)] transition-all border border-[var(--border-ui)]"
                >
                  Cancel
                </button>
                <button
                  onClick={createChannel}
                  disabled={!newChannelName.trim()}
                  className="flex-1 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Channel
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Broadcast Modal */}
      {showBroadcast && isOwner && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-2xl w-full mx-4 md:mx-auto max-h-[80vh] overflow-y-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Broadcast Message</h3>
              <button
                onClick={() => {
                  setShowBroadcast(false);
                  setBroadcastMessage('');
                  setSelectedChannels([]);
                  setSelectedBroadcastUsers([]);
                }}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Select Channels ({selectedChannels.length} selected)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll border border-[var(--border-ui)] rounded-xl p-2 bg-[var(--bg-card-muted)]">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChannels(prev => 
                          prev.includes(ch.id) 
                            ? prev.filter(id => id !== ch.id)
                            : [...prev, ch.id]
                        );
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedChannels.includes(ch.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--border-ui)]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedChannels.includes(ch.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-ui)]'
                      }`}>
                        {selectedChannels.includes(ch.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <ch.icon size={16} className={selectedChannels.includes(ch.id) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate">{ch.name}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{ch.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Select Users ({selectedBroadcastUsers.length} selected)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll border border-[var(--border-ui)] rounded-xl p-2 bg-[var(--bg-card-muted)]">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedBroadcastUsers(prev => 
                          prev.includes(user.id) 
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedBroadcastUsers.includes(user.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                          : 'border-transparent bg-[var(--bg-card)] hover:border-[var(--border-ui)]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedBroadcastUsers.includes(user.id)
                          ? 'border-[var(--accent)] bg-[var(--accent)]'
                          : 'border-[var(--border-ui)]'
                      }`}>
                        {selectedBroadcastUsers.includes(user.id) && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center text-xs font-black uppercase overflow-hidden text-[var(--accent)] shrink-0">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : user.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-black text-[var(--text-primary)] truncate">{user.fullName}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{user.role}</p>
                      </div>
                    </button>
                  ))}
                  {allUsers.length === 0 && (
                    <p className="text-xs text-[var(--text-secondary)] text-center py-4">No users available</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter your broadcast message..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowBroadcast(false);
                    setBroadcastMessage('');
                    setSelectedChannels([]);
                    setSelectedBroadcastUsers([]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-xl font-black uppercase text-sm hover:bg-[var(--bg-card)] transition-all border border-[var(--border-ui)]"
                >
                  Cancel
                </button>
                <button
                  onClick={sendBroadcast}
                  disabled={!broadcastMessage.trim() || (selectedChannels.length === 0 && selectedBroadcastUsers.length === 0)}
                  className="flex-1 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Radio size={16} />
                  Broadcast to {selectedChannels.length + selectedBroadcastUsers.length} Recipient{selectedChannels.length + selectedBroadcastUsers.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Channel Confirmation Modal */}
      {channelToDelete && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-md w-full mx-4 md:mx-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Delete Group</h3>
                <button
                  onClick={() => setChannelToDelete(null)}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Are you sure you want to delete this group? All messages will be permanently deleted. This action cannot be undone.
                </p>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setChannelToDelete(null)}
                    className="flex-1 px-4 py-2.5 bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-xl font-black uppercase text-sm hover:bg-[var(--bg-card)] transition-all border border-[var(--border-ui)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteChannel(channelToDelete)}
                    className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-black uppercase text-sm hover:bg-rose-600 transition-all shadow-lg"
                  >
                    Delete Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Remove Member Modal */}
      {showRemoveMember && currentChannel && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-md w-full mx-4 md:mx-auto max-h-[80vh] overflow-y-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Manage Members</h3>
                <button
                  onClick={() => setShowRemoveMember(false)}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-2">
                  Members ({currentChannel.memberIds?.length || 0})
                </p>
                
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll border border-[var(--border-ui)] rounded-xl p-2 bg-[var(--bg-card-muted)]">
                  {currentChannel.memberIds && currentChannel.memberIds.length > 0 ? (
                    currentChannel.memberIds.map(memberId => {
                      const member = allUsers.find(u => u.id === memberId) || (memberId === userProfile?.id ? userProfile : null);
                      if (!member && memberId !== userProfile?.id) return null;
                      
                      const displayMember = member || userProfile;
                      if (!displayMember) return null;
                      
                      const canRemove = (currentChannel.createdBy === userProfile?.id || isOwner) && memberId !== userProfile?.id;
                      
                      return (
                        <div
                          key={memberId}
                          className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-ui)]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-muted)] border border-[var(--border-ui)] flex items-center justify-center text-xs font-black uppercase overflow-hidden text-[var(--accent)] shrink-0">
                            {displayMember.avatarUrl ? <img src={displayMember.avatarUrl} className="w-full h-full object-cover"/> : displayMember.fullName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[var(--text-primary)] truncate">{displayMember.fullName}{memberId === userProfile?.id ? ' (You)' : ''}</p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">{displayMember.role}</p>
                          </div>
                          {canRemove && (
                            <button
                              onClick={() => removeMemberFromChannel(currentChannel.id, memberId)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <X size={16} />
                            </button>
                          )}
                          {memberId === currentChannel.createdBy && (
                            <span className="px-2 py-1 text-[9px] font-black uppercase bg-[var(--accent)]/20 text-[var(--accent)] rounded">
                              Creator
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)] text-center py-4">No members found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Channel Modal */}
      {showEditChannel && currentChannel && createPortal(
        <div className="exec-modal-overlay" style={{ zIndex: 99999 }}>
          <div className="exec-modal-container max-w-md w-full mx-4 md:mx-auto animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase text-[var(--text-primary)]">Edit Group</h3>
                <button
                  onClick={() => {
                    setShowEditChannel(false);
                    setEditingChannelName('');
                    setEditingChannelDesc('');
                  }}
                  className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-muted)] rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Group Name</label>
                  <input
                    type="text"
                    value={editingChannelName}
                    onChange={(e) => setEditingChannelName(e.target.value)}
                    placeholder="e.g., Marketing, Sales, Support"
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="text-xs font-black uppercase text-[var(--text-secondary)] mb-2 block">Description (Optional)</label>
                  <input
                    type="text"
                    value={editingChannelDesc}
                    onChange={(e) => setEditingChannelDesc(e.target.value)}
                    placeholder="What is this group for?"
                    className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border-ui)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEditChannel(false);
                      setEditingChannelName('');
                      setEditingChannelDesc('');
                    }}
                    className="flex-1 px-4 py-2.5 bg-[var(--bg-card-muted)] text-[var(--text-primary)] rounded-xl font-black uppercase text-sm hover:bg-[var(--bg-card)] transition-all border border-[var(--border-ui)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editChannel}
                    disabled={!editingChannelName.trim()}
                    className="flex-1 px-4 py-2.5 bg-[var(--accent)] text-white rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeamChat;
