<?php

namespace App\Services;

use App\Models\Inspection;

/** Génère le prochain numéro d'anomalie (A-001, A-002...) pour une inspection donnée. */
class NumerotationAnomalieService
{
    public function prochainNumero(Inspection $inspection): string
    {
        $dernier = $inspection->anomalies()
            ->orderByDesc('id')
            ->value('numero');

        $prochain = $dernier ? ((int) substr($dernier, 2)) + 1 : 1;

        return 'A-' . str_pad((string) $prochain, 3, '0', STR_PAD_LEFT);
    }
}
