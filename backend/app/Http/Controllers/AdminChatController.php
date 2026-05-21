<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminChatController extends Controller
{
    /**
     * Middleware check inside methods or routes to ensure user is admin or helpdesk.
     */
    protected function checkAdmin(Request $request)
    {
        if (!in_array($request->user()->role, ['admin', 'helpdesk'])) {
            abort(403, 'Akses ditolak. Hanya untuk Admin atau Helpdesk.');
        }
    }

    /**
     * Get all active and waiting chat sessions for admin panel.
     */
    public function getSessions(Request $request)
    {
        $this->checkAdmin($request);

        // Fetch only sessions that need attention: waiting or human (not bot/closed)
        $sessions = ChatSession::whereIn('mode', ['waiting', 'human'])
            ->whereHas('user', function($q) {
                $q->whereNotIn('role', ['admin', 'helpdesk']);
            })
            ->with(['user' => function($q) {
                $q->select('id', 'name', 'email');
            }])
            ->orderBy('last_message_at', 'desc')
            ->get();

        // Calculate unread user messages for each session
        $sessions->map(function($session) {
            $session->unread_count = ChatMessage::where('session_id', $session->id)
                ->where('sender_type', 'user')
                ->where('is_read_admin', false)
                ->count();
            
            // Get the last message preview
            $lastMsg = ChatMessage::where('session_id', $session->id)
                ->orderBy('created_at', 'desc')
                ->first();
            $session->last_message_preview = $lastMsg ? $lastMsg->content : '';
            return $session;
        });

        return response()->json($sessions);
    }

    /**
     * Get messages for a session and mark them as read by admin.
     */
    public function getMessages(Request $request, $id)
    {
        $this->checkAdmin($request);

        $session = ChatSession::findOrFail($id);

        // Mark user messages as read
        ChatMessage::where('session_id', $session->id)
            ->where('sender_type', 'user')
            ->update(['is_read_admin' => true]);

        $messages = ChatMessage::where('session_id', $session->id)
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'session' => $session->load('user'),
            'messages' => $messages
        ]);
    }

    /**
     * Takeover a chat session from AI Bot.
     */
    public function takeover(Request $request, $id)
    {
        $this->checkAdmin($request);

        $session = ChatSession::findOrFail($id);
        $admin = $request->user();

        $session->update([
            'mode' => 'human',
            'admin_id' => $admin->id,
            'last_message_at' => Carbon::now()
        ]);

        $systemMsg = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => 'system',
            'content' => "Admin {$admin->name} telah bergabung dalam obrolan.",
        ]);

        return response()->json([
            'session' => $session->load('user'),
            'system_message' => $systemMsg
        ]);
    }

    /**
     * Send message from admin.
     */
    public function sendMessage(Request $request, $id)
    {
        $this->checkAdmin($request);

        $request->validate([
            'content' => 'required|string|max:1000'
        ]);

        $session = ChatSession::findOrFail($id);

        $adminMessage = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => 'admin',
            'sender_id' => $request->user()->id,
            'content' => $request->content
        ]);

        $session->update([
            'last_message_at' => Carbon::now()
        ]);

        return response()->json($adminMessage->load('sender'));
    }

    /**
     * Close/end the live chat with admin and return session back to bot.
     */
    public function closeSession(Request $request, $id)
    {
        $this->checkAdmin($request);

        $session = ChatSession::findOrFail($id);

        // Return session to bot mode so user can continue with AI
        $session->update([
            'mode' => 'bot',
            'admin_id' => null,
            'last_message_at' => Carbon::now()
        ]);

        $systemMsg = ChatMessage::create([
            'session_id' => $session->id,
            'sender_type' => 'system',
            'content' => 'Sesi live chat dengan Admin telah selesai. Asisten virtual Wisma 46 Space kembali aktif untuk membantu Anda.',
        ]);

        return response()->json([
            'session' => $session,
            'system_message' => $systemMsg
        ]);
    }
}
