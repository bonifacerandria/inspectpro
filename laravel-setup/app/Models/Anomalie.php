<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Anomalie extends Model
{
    protected $fillable = [
        'inspection_id', 'reponse_controle_id', 'numero', 'constat', 'gravite',
        'action_recommandee', 'responsable', 'delai', 'statut',
    ];

    protected function casts(): array
    {
        return ['delai' => 'date'];
    }

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function reponseControle()
    {
        return $this->belongsTo(ReponseControle::class, 'reponse_controle_id');
    }

    public function photos()
    {
        return $this->hasMany(Photo::class, 'photographiable_id')
            ->where('photographiable_type', 'anomalie');
    }
}
