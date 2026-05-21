<?php
$apiKey = getenv('GROQ_API_KEY') ?: 'YOUR_GROQ_API_KEY';
$payload = json_encode([
    'model' => 'llama-3.1-8b-instant',
    'messages' => [['role' => 'user', 'content' => 'cara booking gimana']],
    'max_tokens' => 100
]);

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

echo "HTTP: $httpCode\n";
if ($curlErr) echo "CURL ERROR: $curlErr\n";
$data = json_decode($result, true);
echo "REPLY: " . ($data['choices'][0]['message']['content'] ?? $result) . "\n";
