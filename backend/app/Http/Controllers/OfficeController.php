<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        return response()->json(Office::all());
    }

    public function show($id)
    {
        $office = Office::find($id);
        if (!$office) {
            return response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
        }
        return response()->json($office);
    }

    public function store(Request $request)
    {
        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office = Office::create($data);
        return response()->json($office, 201);
    }

    public function update(Request $request, $id)
    {
        $office = Office::find($id);
        if (!$office) {
            return response()->json(['message' => 'Ruangan tidak ditemukan'], 404);
        }

        $data = $request->all();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('offices', 'public');
            $data['gambar'] = asset('storage/' . $path);
        }

        $office->update($data);
        return response()->json($office);
    }

    public function destroy($id)
    {
        $office = Office::find($id);
        if ($office) {
            $office->delete();
        }
        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }
}
