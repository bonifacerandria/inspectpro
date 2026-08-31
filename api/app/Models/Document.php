<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'inspection_id', 'document_requis_id', 'libelle', 'present',
        'chemin_fichier', 'commentaire', 'created_at',
    ];

    protected function casts(): array
    {
        return ['present' => 'boolean'];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function documentRequis()
    {
        return $this->belongsTo(DocumentRequis::class, 'document_requis_id');
    }
}
