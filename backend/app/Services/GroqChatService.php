<?php

namespace App\Services;

use App\Models\Office;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqChatService
{
    /**
     * @var string|null
     */
    protected ?string $apiKey;

    /**
     * @var string
     */
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key') ?: env('GROQ_API_KEY');
        $this->model = config('services.groq.model') ?: env('GROQ_MODEL', 'llama-3.1-8b-instant');
    }

    /**
     * Get reply from Groq AI Llama 3.1
     * 
     * @param string $message
     * @param array $history
     * @return array ['reply' => string, 'needs_human' => bool]
     */
    public function getReply(string $message, array $history = []): array
    {
        // 1. Fallback if API key is not configured or dummy
        if (!$this->apiKey || $this->apiKey === 'your_groq_api_key_here') {
            return [
                'reply' => 'Maaf, asisten AI Wisma 46 Space sedang tidak dapat terhubung karena sedang dalam maintenance. Silakan hubungi kami via WhatsApp atau minta bantuan Admin langsung.',
                'needs_human' => true
            ];
        }

        try {
            // 2. Fetch all available rooms to inject as context
            $rooms = Office::where('status', 'Tersedia')->get(['nama', 'kategori', 'kapasitas', 'harga', 'fasilitas', 'deskripsi', 'is_popular']);

            $roomsContext = "";
            foreach ($rooms as $index => $room) {
                $popularText = $room->is_popular ? " [Terpopuler]" : "";
                $facilities = is_array($room->fasilitas) ? implode(', ', $room->fasilitas) : $room->fasilitas;
                // Limit facilities and description to keep prompt size small and prevent token rate limit errors
                $facilities = strlen($facilities) > 50 ? substr($facilities, 0, 47) . '...' : $facilities;
                $shortDesc = strlen($room->deskripsi) > 60 ? substr($room->deskripsi, 0, 57) . '...' : $room->deskripsi;
                $roomsContext .= sprintf(
                    "- %s%s (%s, Kapasitas: %d orang, Rp %s/hari) | Fasilitas: %s | Deskripsi: %s\n",
                    $room->nama,
                    $popularText,
                    $room->kategori,
                    $room->kapasitas,
                    number_format($room->harga, 0, ',', '.'),
                    $facilities,
                    $shortDesc
                );
            }

            // 3. Build system prompt
            $systemPrompt = "Kamu adalah asisten virtual pintar dan ramah dari 'Wisma 46 Space' — portal penyewaan ruang kerja premium (Office Suite, Meeting Room, Coworking Space) di gedung pencakar langit ikonik Wisma 46, Kota BNI Jakarta.\n\n"
                . "TUGAS UTAMA KAMU:\n"
                . "- Jawablah pertanyaan user seputar informasi ruangan, spesifikasi, harga, dan fasilitas.\n"
                . "- JANGAN menawarkan bantuan untuk memproses reservasi, pemesanan, atau transaksi pembayaran secara langsung di dalam chat. Bot TIDAK memiliki akses untuk melakukan booking atau mengonfirmasi pembayaran.\n"
                . "- Jika user ingin menyewa atau memesan ruangan, instruksikan mereka untuk mengklik tombol 'Detail' pada ruangan yang diinginkan di website lalu mengisi formulir pemesanan secara mandiri.\n"
                . "- Jika user menanyakan status pembayaran atau meminta bantuan reservasi khusus, arahkan mereka untuk meminta bantuan Admin Helpdesk langsung di chat ini dengan memicu pemindahan ke admin, atau menghubungi kami via WhatsApp.\n"
                . "- Bersikaplah sangat profesional, premium, sopan, dan hangat.\n"
                . "- Jawablah dalam bahasa yang sama dengan yang digunakan oleh user (Indonesia atau Inggris).\n"
                . "- Kamu BEBAS dan diperbolehkan menyesuaikan panggilan/gaya bahasa dengan gaya bicara user (boleh menggunakan sapaan kasual/santai seperti 'bro', 'sis', 'cuy' jika user menyapa dengan santai, atau sapaan sopan seperti 'Kak'/'Anda' jika user berbicara formal) agar obrolan terasa akrab dan interaktif.\n"
                . "- Pastikan kalimat pembuka selalu natural, ramah, dan positif. Jangan gunakan kalimat tanya negatif yang canggung seperti 'Gak ada yang bisa kami bantu sekarang?'.\n"
                . "- Jika user menanyakan hal di luar konteks Wisma 46 Space, tolaklah dengan halus dan arahkan kembali ke topik sewa ruangan.\n\n"
                . "ATURAN PENULISAN RESPONS (CONCISE & PREMIUM):\n"
                . "- JAWABLAH DENGAN SINGKAT, RAMAH, DAN JELAS. Hindari membuat tulisan yang terlalu panjang (wall-of-text) atau menyalin seluruh daftar ruangan.\n"
                . "- Jika user menanyakan ruangan yang tersedia atau meminta rekomendasi, JANGAN daftarkan semua ruangan! Cukup pilih 2 atau maksimal 3 ruangan saja yang paling cocok dengan kriteria mereka.\n"
                . "- Berikan detail yang sangat ringkas: Nama Ruangan, Kapasitas, Harga, dan 1 kalimat ringkasan saja.\n"
                . "- Akhiri dengan menyarankan user melihat detail ruangan di website jika ingin melakukan pemesanan.\n\n"
                . "ATURAN TRANSFER KE ADMIN (HUMAN):\n"
                . "- Jika user menyatakan ingin berbicara dengan manusia, admin, CS, customer service, staff, orang, atau meminta bantuan pembayaran/konfirmasi manual, kamu HARUS menambahkan teks tag '[REQUEST_HUMAN]' di akhir atau di dalam respons kamu.\n"
                . "- Jika user bertanya tentang detail teknis spesifik yang TIDAK ada di data ruangan di bawah ini, atau setelah 3x kamu merasa tidak bisa menjawab kepuasan mereka, tambahkan tag '[REQUEST_HUMAN]' dan sarankan dengan ramah untuk terhubung ke admin.\n\n"
                . "DATA RUANGAN YANG TERSEDIA SAAT INI DI WISMA 46:\n"
                . $roomsContext
                . "KONTAK DUMMY BANTUAN MANUAL:\n"
                . "- WhatsApp: 081234567890\n"
                . "- Email: info@wisma46space.com";

            // 4. Formulate messages payload
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt]
            ];

            // Append chat history (limit to last 4 messages for token safety and avoiding rate limit)
            $history = array_slice($history, -4);
            foreach ($history as $msg) {
                $role = ($msg['sender_type'] === 'user') ? 'user' : 'assistant';
                // Clean tag out of history to not bias the next generation
                $cleanContent = str_replace('[REQUEST_HUMAN]', '', $msg['content']);
                $messages[] = ['role' => $role, 'content' => $cleanContent];
            }

            // Add the new user message
            $messages[] = ['role' => 'user', 'content' => $message];

            // 5. API call with automatic model fallback on rate limit (429)
            $modelsToTry = [$this->model, 'gemma2-9b-it', 'llama3-8b-8192', 'mixtral-8x7b-32768'];
            $modelsToTry = array_values(array_unique($modelsToTry));

            $response = null;
            $success = false;

            foreach ($modelsToTry as $currentModel) {
                try {
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json',
                    ])->timeout(25)->post('https://api.groq.com/openai/v1/chat/completions', [
                        'model' => $currentModel,
                        'messages' => $messages,
                        'temperature' => 0.6,
                        'max_tokens' => 800,
                    ]);

                    if ($response->successful()) {
                        $success = true;
                        break;
                    }

                    if ($response->status() !== 429) {
                        break;
                    }

                    Log::warning("Groq API Model {$currentModel} Rate Limit (429) Hit. Trying next model...");
                } catch (\Exception $e) {
                    Log::warning("Groq API Model {$currentModel} failed: " . $e->getMessage());
                }
            }

            if ($success && $response) {
                $reply = $response->json('choices.0.message.content');
                $needsHuman = str_contains($reply, '[REQUEST_HUMAN]');

                // Clean the tag from the final response text so it doesn't show to users
                $cleanReply = trim(str_replace('[REQUEST_HUMAN]', '', $reply));

                return [
                    'reply' => $cleanReply,
                    'needs_human' => $needsHuman
                ];
            }

            if ($response && $response->status() === 429) {
                Log::warning('All Groq API models rate limited.');
                return [
                    'reply' => 'Maaf, saat ini asisten AI menerima terlalu banyak pesan (Rate Limit). Silakan kirim pesan Anda kembali dalam beberapa detik.',
                    'needs_human' => false
                ];
            }

            $status = $response ? $response->status() : 'Unknown';
            $body = $response ? $response->body() : 'No response';
            Log::error("Groq API Error [{$status}]: " . $body);
            return [
                'reply' => 'Maaf, asisten kami mengalami gangguan sementara. Silakan coba kirim pesan lagi.',
                'needs_human' => false
            ];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Groq Timeout/Connection Error: ' . $e->getMessage());
            return [
                'reply' => 'Asisten AI sedang lambat merespons. Silakan kirim pesan lagi dalam beberapa detik.',
                'needs_human' => false
            ];
        } catch (\Exception $e) {
            Log::error('Groq Exception: ' . $e->getMessage());
            return [
                'reply' => 'Maaf, asisten kami sedang beristirahat sejenak. Silakan coba kirim pesan lagi.',
                'needs_human' => false
            ];
        }
    }
}
