<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReponseControle extends Model
{
    protected $fillable = [
        'inspection_id', 'point_controle_id', 'statut', 'valeur_texte',
        'valeur_nombre', 'valeur_choix', 'commentaire',
    ];

    public function inspection()
    {
        return $this->belongsTo(Inspection::class);
    }

    public function pointControle()
    {
        return $this->belongsTo(PointControle::class, 'point_controle_id');
    }

    public function anomalie()
    {
        return $this->hasOne(Anomalie::class);
    }

    public function mesure()
    {
        return $this->hasOne(Mesure::class);
    }

    /** Une réponse déclenche une anomalie si son statut n'est pas conforme */
    public function declencheAnomalie(): bool
    {
        return in_array($this->statut, ['NC', 'DM', 'DI'], true);
    }
}
