<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'inspection_id', 'photographiable_type', 'photographiable_id',
        'libelle', 'numero', 'chemin_fichier', 'prise_le', 'created_at',
    ];

    protected function casts(): array
    {
        return ['prise_le' => 'datetime'];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    /**
     * Relation polymorphe manuelle (photographiable_type/id ne suit pas la
     * convention Laravel *_type/*_id d'un morphTo classique en snake_case
     * français) — résolue explicitement plutôt que via morphTo() magique.
     */
    public function cible()
    {
        return match ($this->photographiable_type) {
            'anomalie' => Anomalie::find($this->photographiable_id),
            'equipement' => Equipement::find($this->photographiable_id),
            'document' => Document::find($this->photographiable_id),
            'photo_obligatoire' => PhotoObligatoire::find($this->photographiable_id),
            'signature' => Signature::find($this->photographiable_id),
            'reponse_controle' => ReponseControle::find($this->photographiable_id),
            default => null,
        };
    }
}
