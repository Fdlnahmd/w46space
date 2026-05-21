<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Services\GroqChatService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ChatController extends Controller
{
    protected $groqService;

    public function __construct(GroqChatService $groqService)
    {
        $this->groqService = $groqService;
    }

    /**
     * Get or create active chat session for logged in user.
     */
    public function getSession(Request $request)
    {
        $user = $request->user();

        // Find active session (not closed)
        $session = ChatSession::where('user_id', $user->id)
            ->where('mode', '!=', 'closed')
            ->first();

        if (!$session) {
            // No active session — create fresh one
            $session = ChatSession::create([
                'user_id' => $user->id,
                'mode' => 'bot',
                'last_message_at' => Carbon::now(),
            ]);

            // Add welcome system message
            ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => 'system',
                'content' => 'Selamat datang di Wisma 46 Space Virtual Assistant! Ada yang bisa kami bantu seputar penyewaan ruangan?',
            ]);
        }

        return response()->json($session);
    }

    /**
     * Get all messages for the active session.
     */
    public function getMessages(Request $request)
    {
        $user = $request->user();

        $session = ChatSession::where('user_id', $user->id)
            ->where('mode', '!=', 'closed')
            ->first();

        if (!$session) {
            return response()->json([]);
        }

        $messages = ChatMessage::where('session_id', $session->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send message from user.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $user = $request->user();

        $session = ChatSession::where('user_id', $user->id)
            ->where('mode', '!=', 'closed')
            ->first();

        if (!$session) {
            $session = ChatSession::create([
                'user_id' => $user->id,
                'mode' => 'bot',
                'last_message_at' => Carbon::now(),
            ]);
        }

        // 1. Save user's message
        $userMessage = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => 'user',
            'content' => $request->content,
            'is_read_admin' => false,
        ]);

        $session->update([
            'last_message_at' => Carbon::now(),
        ]);

        $botReply = null;
        $systemMsg = null;

        // 2. Auto reply if in bot mode
        if ($session->mode === 'bot') {
            // Get last 10 messages for context
            $history = ChatMessage::where('session_id', $session->id)
                ->where('id', '!=', $userMessage->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->toArray();

            // Call Groq Llama AI
            $aiResponse = $this->groqService->getReply($request->content, $history);

            // Save bot message
            $botReply = ChatMessage::create([
                'session_id' => $session->id,
                'sender_type' => 'bot',
                'content' => $aiResponse['reply'],
            ]);

            // If AI flags human handoff or user explicitly asks
            if ($aiResponse['needs_human']) {
                $session->update(['mode' => 'waiting']);

                $systemMsg = ChatMessage::create([
                    'session_id' => $session->id,
                    'sender_type' => 'system',
                    'content' => 'Permintaan Anda diteruskan ke Customer Service. Mohon tunggu sebentar, Admin Wisma 46 Space akan segera bergabung.',
                ]);
            }
        }

        return response()->json([
            'session' => $session->fresh(),
            'user_message' => $userMessage,
            'bot_message' => $botReply,
            'system_message' => $systemMsg,
        ]);
    }

    /**
     * Manually request human operator.
     */
    public function requestHuman(Request $request)
    {
        $user = $request->user();

        $session = ChatSession::where('user_id', $user->id)
            ->where('mode', '!=', 'closed')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Tidak ada sesi aktif.'], 404);
        }

        $session->update(['mode' => 'waiting']);

        $systemMsg = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => 'system',
            'content' => 'Asisten dinonaktifkan. Menghubungkan ke Customer Service Wisma 46 Space... Mohon tunggu.',
        ]);

        return response()->json([
            'session' => $session,
            'system_message' => $systemMsg,
        ]);
    }

    /**
     * Reset/close session so we can start over with the AI bot.
     */
    public function resetSession(Request $request)
    {
        $user = $request->user();

        // Find active session
        $session = ChatSession::where('user_id', $user->id)
            ->where('mode', '!=', 'closed')
            ->first();

        if ($session) {
            // Update to closed so next getSession will create a fresh one!
            $session->update(['mode' => 'closed']);
        }

        return response()->json(['message' => 'Session reset successfully.']);
    }
}

