<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    protected $fillable = [
        'equipement_id', 'inspecteur_id', 'date_inspection', 'statut',
        'nb_points_controles', 'nb_conformes', 'nb_observations',
        'nb_non_conformes', 'nb_defauts_majeurs', 'nb_dangers_immediats',
        'avis_propose', 'conclusion', 'date_validation',
    ];

    protected function casts(): array
    {
        return [
            'date_inspection' => 'date',
            'date_validation' => 'datetime',
        ];
    }

    public function equipement()
    {
        return $this->belongsTo(Equipement::class);
    }

    public function inspecteur()
    {
        return $this->belongsTo(User::class, 'inspecteur_id');
    }

    public function reponses()
    {
        return $this->hasMany(ReponseControle::class);
    }

    public function anomalies()
    {
        return $this->hasMany(Anomalie::class);
    }

    public function photos()
    {
        return $this->hasMany(Photo::class);
    }

    public function essais()
    {
        return $this->hasMany(Essai::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function signatures()
    {
        return $this->hasMany(Signature::class);
    }

    public function rapport()
    {
        return $this->hasOne(Rapport::class);
    }

    public function estModifiable(): bool
    {
        return $this->statut === 'en_cours';
    }
}
