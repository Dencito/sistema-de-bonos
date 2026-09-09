@php

    $shift = $r['shift'];

    // Los montos vienen como decimal:2 (string) desde la base.
    $money = fn ($v) => '$' . number_format((float) $v, 0, ',', '.');
    $fecha = fn ($d) => $d
        ? \Illuminate\Support\Carbon::parse($d)->timezone(config('app.timezone'))->format('d/m/Y H:i')
        : '-';
    $fechaSeg = fn ($d) => $d
        ? \Illuminate\Support\Carbon::parse($d)->timezone(config('app.timezone'))->format('d/m/Y H:i:s')
        : '-';

    $diferencia = (float) $shift->difference;
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte de caja</title>
</head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:13px;">
<div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">

    <div style="background:#0f172a;color:#ffffff;padding:18px 22px;">
        <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;">
            {{ $r['empresa'] }} · {{ $r['sucursal'] }}
        </div>
        <div style="font-size:19px;font-weight:bold;margin-top:4px;">
            {{ $shift->is_active ? 'Estado del turno en curso' : 'Cierre de caja' }} · Turno #{{ $shift->id }}
        </div>
        <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">
            {{ $r['motivo'] ?? '' }}
            @if (!empty($r['solicitado_por']))
                · Solicitado por {{ $r['solicitado_por'] }}
            @endif
            · Generado el {{ $fechaSeg($r['generado_at']) }} (hora de Chile)
        </div>
    </div>

    <div style="padding:22px;">

        {{-- Datos del turno --}}
        <h3 style="margin:0 0 8px;font-size:14px;">Datos del turno</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
            <tr>
                <td style="background:#f8fafc;width:180px;border:1px solid #e2e8f0;">Sucursal</td>
                <td style="border:1px solid #e2e8f0;">{{ $r['sucursal'] }}</td>
                <td style="background:#f8fafc;width:180px;border:1px solid #e2e8f0;">Cajero/a</td>
                <td style="border:1px solid #e2e8f0;">{{ $r['cajero'] }}</td>
            </tr>
            <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">Apertura</td>
                <td style="border:1px solid #e2e8f0;">{{ $fechaSeg($shift->started_at) }}</td>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">Cierre</td>
                <td style="border:1px solid #e2e8f0;">
                    {{ $shift->ended_at ? $fechaSeg($shift->ended_at) : 'En curso' }}
                </td>
            </tr>
            <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">Estado</td>
                <td style="border:1px solid #e2e8f0;">
                    {{ $shift->is_active ? 'ABIERTO' : 'CERRADO' }}
                </td>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">Valor cargado por admin</td>
                <td style="border:1px solid #e2e8f0;">
                    {{ $shift->admin_initial_value !== null ? $money($shift->admin_initial_value) : '-' }}
                    @if ($r['admin'])
                        <span style="color:#64748b;">({{ $r['admin'] }})</span>
                    @endif
                </td>
            </tr>
        </table>

        {{-- Saldos --}}
        <h3 style="margin:22px 0 8px;font-size:14px;">Saldos</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
            <tr>
                <td style="background:#f8fafc;width:180px;border:1px solid #e2e8f0;">Saldo anterior</td>
                <td style="border:1px solid #e2e8f0;text-align:right;">{{ $money($shift->previous_balance) }}</td>
                <td style="background:#f8fafc;width:180px;border:1px solid #e2e8f0;">Saldo agregado</td>
                <td style="border:1px solid #e2e8f0;text-align:right;">{{ $money($shift->initial_balance) }}</td>
            </tr>
            <tr>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">Saldo inicial total</td>
                <td style="border:1px solid #e2e8f0;text-align:right;">{{ $money($shift->total_initial_balance) }}</td>
                <td style="background:#f8fafc;border:1px solid #e2e8f0;">
                    {{ $shift->is_active ? 'Saldo actual en caja' : 'Total contado al cierre' }}
                </td>
                <td style="border:1px solid #e2e8f0;text-align:right;font-weight:bold;">
                    {{ $money($shift->current_balance) }}
                </td>
            </tr>
            @if (!$shift->is_active)
                <tr>
                    <td style="background:#f8fafc;border:1px solid #e2e8f0;">Diferencia</td>
                    <td colspan="3" style="border:1px solid #e2e8f0;text-align:right;font-weight:bold;color:{{ $diferencia < 0 ? '#b91c1c' : ($diferencia > 0 ? '#b45309' : '#15803d') }};">
                        {{ $money($diferencia) }}
                        <span style="font-weight:normal;color:#64748b;">
                            ({{ $diferencia < 0 ? 'faltante' : ($diferencia > 0 ? 'sobrante' : 'sin diferencia') }})
                        </span>
                    </td>
                </tr>
            @endif
        </table>

        {{-- Conteo fisico --}}
        <h3 style="margin:22px 0 8px;font-size:14px;">Conteo físico</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
            <tr style="background:#f8fafc;">
                <th align="left" style="border:1px solid #e2e8f0;">Denominación</th>
                <th align="right" style="border:1px solid #e2e8f0;">Apertura</th>
                <th align="right" style="border:1px solid #e2e8f0;">Cierre</th>
            </tr>
            @foreach ([20000, 10000, 5000, 2000, 1000] as $den)
                <tr>
                    <td style="border:1px solid #e2e8f0;">{{ $money($den) }}</td>
                    <td align="right" style="border:1px solid #e2e8f0;">{{ (int) $shift->{'opening_' . $den} }}</td>
                    <td align="right" style="border:1px solid #e2e8f0;">{{ (int) $shift->{'closing_' . $den} }}</td>
                </tr>
            @endforeach
            <tr>
                <td style="border:1px solid #e2e8f0;">Monedas</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($shift->opening_coins) }}</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($shift->closing_coins) }}</td>
            </tr>
            <tr style="background:#f8fafc;font-weight:bold;">
                <td style="border:1px solid #e2e8f0;">Total contado</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($shift->opening_total_counted) }}</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($shift->closing_total_counted) }}</td>
            </tr>
        </table>

        @if ($shift->closing_notes)
            <p style="margin:10px 0 0;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
                <strong>Notas de cierre:</strong> {{ $shift->closing_notes }}
            </p>
        @endif

        {{-- Totales por tipo --}}
        <h3 style="margin:22px 0 8px;font-size:14px;">Totales por tipo de movimiento</h3>
        @if (empty($r['por_tipo']))
            <p style="color:#64748b;">Sin movimientos registrados.</p>
        @else
            <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
                <tr style="background:#f8fafc;">
                    <th align="left" style="border:1px solid #e2e8f0;">Tipo</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Cant.</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Caja</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Pasillera</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Total</th>
                </tr>
                @foreach ($r['por_tipo'] as $fila)
                    <tr>
                        <td style="border:1px solid #e2e8f0;">{{ $fila['tipo'] }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $fila['cantidad'] }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $money($fila['caja']) }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $money($fila['pasillera']) }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;">{{ $money($fila['total']) }}</td>
                    </tr>
                @endforeach
            </table>
        @endif

        {{-- Tickets --}}
        @php $tk = $r['tickets']; @endphp
        <h3 style="margin:22px 0 8px;font-size:14px;">Tickets del turno ({{ $tk['cantidad'] }})</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
            <tr style="background:#f8fafc;">
                <th align="left" style="border:1px solid #e2e8f0;">Origen</th>
                <th align="right" style="border:1px solid #e2e8f0;">Cantidad</th>
                <th align="right" style="border:1px solid #e2e8f0;">Monto entregado</th>
            </tr>
            <tr>
                <td style="border:1px solid #e2e8f0;">Emitidos durante el turno</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $tk['normales']['cantidad'] }}</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($tk['normales']['total']) }}</td>
            </tr>
            <tr>
                <td style="border:1px solid #e2e8f0;">
                    Fantasmas asignados a este turno
                </td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $tk['fantasmas']['cantidad'] }}</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($tk['fantasmas']['total']) }}</td>
            </tr>
            <tr style="background:#f8fafc;font-weight:bold;">
                <td style="border:1px solid #e2e8f0;">Total</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $tk['cantidad'] }}</td>
                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($tk['total']) }}</td>
            </tr>
        </table>

        @if ($tk['pendientes']['cantidad'] > 0)
            <p style="margin:10px 0 0;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#991b1b;">
                <strong>Atención:</strong> quedan {{ $tk['pendientes']['cantidad'] }} ticket(s) fantasma
                sin asignar en esta sucursal por {{ $money($tk['pendientes']['total']) }}.
                Esa plata todavía no está descontada de ninguna caja.
            </p>
        @endif

        @if (!empty($tk['lista']))
            <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;margin-top:10px;font-size:12px;">
                <tr style="background:#f8fafc;">
                    <th align="left" style="border:1px solid #e2e8f0;">Fecha</th>
                    <th align="left" style="border:1px solid #e2e8f0;">N°</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Tipo</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Monto</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Jugador</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Fantasma</th>
                </tr>
                @foreach ($tk['lista'] as $t)
                    <tr @if ($t['es_fantasma']) style="background:#faf5ff;" @endif>
                        <td style="border:1px solid #e2e8f0;white-space:nowrap;">{{ $fechaSeg($t['created_at']) }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $t['id'] }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $t['type'] ?: '-' }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;white-space:nowrap;">{{ $money($t['amount']) }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $t['jugador'] ?: '-' }}</td>
                        <td style="border:1px solid #e2e8f0;color:#7e22ce;">
                            {{ $t['es_fantasma'] ? 'Sí, asignado el ' . $fecha($t['asignado_at']) : '-' }}
                        </td>
                    </tr>
                @endforeach
            </table>
        @endif

        <p style="margin:6px 0 0;color:#64748b;font-size:11px;">
            Los tickets emitidos se asocian al turno por su fecha, entre la apertura y el cierre.
            Los fantasmas son los que quedaron sin turno y se asignaron a mano desde el panel de caja:
            su fecha cae fuera de esa ventana, pero su plata sí salió de esta caja.
        </p>

        {{-- Pasilleras --}}
        <h3 style="margin:22px 0 8px;font-size:14px;">Pasilleras ({{ count($r['pasilleras']) }})</h3>
        @if (empty($r['pasilleras']))
            <p style="color:#64748b;">No se asignó ninguna pasillera en este turno.</p>
        @else
            <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
                <tr style="background:#f8fafc;">
                    <th align="left" style="border:1px solid #e2e8f0;">Pasillera</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Saldo asignado</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Pagos</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Saldo actual</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Movs.</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Estado</th>
                </tr>
                @foreach ($r['pasilleras'] as $p)
                    <tr>
                        <td style="border:1px solid #e2e8f0;">{{ $p['nombre'] }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $money($p['initial_balance']) }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $money($p['total_payments']) }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;">{{ $money($p['current_balance']) }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;">{{ $p['cantidad_movimientos'] }}</td>
                        <td style="border:1px solid #e2e8f0;">
                            {{ $p['is_active'] ? 'Activa' : 'Cerrada' }}{{ $p['force_closed'] ? ' (forzada)' : '' }}
                        </td>
                    </tr>
                @endforeach
            </table>

            {{-- Detalle de cada pasillera --}}
            @foreach ($r['pasilleras'] as $p)
                <div style="margin-top:16px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
                    <div style="background:#f1f5f9;padding:10px 12px;">
                        <strong>{{ $p['nombre'] }}</strong>
                        <span style="color:#64748b;">
                            · {{ $p['is_active'] ? 'Activa' : 'Cerrada' }}{{ $p['force_closed'] ? ' (forzada)' : '' }}
                            · {{ $p['cantidad_movimientos'] }} movimiento(s) por {{ $money($p['total_movimientos']) }}
                            @if ($p['ediciones'] > 0)
                                · <span style="color:#b45309;">{{ $p['ediciones'] }} corrección(es)</span>
                            @endif
                        </span>
                    </div>

                    <div style="padding:12px;">
                        <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;">
                            <tr style="background:#f8fafc;">
                                <td style="border:1px solid #e2e8f0;">Saldo asignado</td>
                                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($p['initial_balance']) }}</td>
                                <td style="border:1px solid #e2e8f0;">Gastado / rendido</td>
                                <td align="right" style="border:1px solid #e2e8f0;">{{ $money($p['rendido']) }}</td>
                                <td style="border:1px solid #e2e8f0;">Le queda</td>
                                <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;color:{{ $p['current_balance'] > 0 ? '#b45309' : '#15803d' }};">
                                    {{ $money($p['current_balance']) }}
                                </td>
                            </tr>
                        </table>

                        @if (!empty($p['por_tipo']))
                            <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;margin-top:10px;">
                                <tr style="background:#f8fafc;">
                                    <th align="left" style="border:1px solid #e2e8f0;">Tipo</th>
                                    <th align="right" style="border:1px solid #e2e8f0;">Cant.</th>
                                    <th align="right" style="border:1px solid #e2e8f0;">Total</th>
                                </tr>
                                @foreach ($p['por_tipo'] as $pt)
                                    <tr>
                                        <td style="border:1px solid #e2e8f0;">{{ $pt['tipo'] }}</td>
                                        <td align="right" style="border:1px solid #e2e8f0;">{{ $pt['cantidad'] }}</td>
                                        <td align="right" style="border:1px solid #e2e8f0;">{{ $money($pt['total']) }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        @endif

                        @if (empty($p['movimientos']))
                            <p style="margin:10px 0 0;color:#64748b;">No registró movimientos.</p>
                        @else
                            <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;margin-top:10px;">
                                <tr style="background:#f8fafc;">
                                    <th align="left" style="border:1px solid #e2e8f0;">Fecha</th>
                                    <th align="left" style="border:1px solid #e2e8f0;">Tipo</th>
                                    <th align="right" style="border:1px solid #e2e8f0;">Monto</th>
                                    <th align="left" style="border:1px solid #e2e8f0;">Cliente</th>
                                    <th align="left" style="border:1px solid #e2e8f0;">Máquina / Gasto</th>
                                </tr>
                                @foreach ($p['movimientos'] as $m)
                                    <tr>
                                        <td style="border:1px solid #e2e8f0;white-space:nowrap;">{{ $fechaSeg($m['created_at']) }}</td>
                                        <td style="border:1px solid #e2e8f0;">{{ $m['tipo'] }}</td>
                                        <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;white-space:nowrap;">{{ $money($m['amount']) }}</td>
                                        <td style="border:1px solid #e2e8f0;">{{ $m['client'] ?: '-' }}</td>
                                        <td style="border:1px solid #e2e8f0;">
                                            {{ $m['machine'] ? 'Máq. ' . $m['machine'] : ($m['expense_type'] ?: '-') }}
                                        </td>
                                    </tr>
                                    @if (!empty($m['ediciones']))
                                        <tr>
                                            <td colspan="5" style="border:1px solid #e2e8f0;background:#fffbeb;color:#92400e;font-size:11px;">
                                                <strong>Corrigió:</strong>
                                                @foreach ($m['ediciones'] as $e)
                                                    <div>
                                                        {{ implode(' · ', $e['cambios']) }}
                                                        — {{ $e['user'] ?: 'usuario desconocido' }}, {{ $fecha($e['at']) }}
                                                    </div>
                                                @endforeach
                                            </td>
                                        </tr>
                                    @endif
                                @endforeach
                            </table>
                        @endif
                    </div>
                </div>
            @endforeach
        @endif

        {{-- Movimientos --}}
        <h3 style="margin:22px 0 8px;font-size:14px;">
            Movimientos del turno ({{ $r['cantidad_movimientos'] }})
        </h3>
        @if (empty($r['movimientos']))
            <p style="color:#64748b;">Sin movimientos registrados.</p>
        @else
            <table width="100%" cellpadding="5" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;font-size:12px;">
                <tr style="background:#f8fafc;">
                    <th align="left" style="border:1px solid #e2e8f0;">Fecha</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Tipo</th>
                    <th align="right" style="border:1px solid #e2e8f0;">Monto</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Cliente</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Máquina / Gasto</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Origen</th>
                    <th align="left" style="border:1px solid #e2e8f0;">Registró</th>
                </tr>
                @foreach ($r['movimientos'] as $m)
                    <tr>
                        <td style="border:1px solid #e2e8f0;white-space:nowrap;">{{ $fechaSeg($m['created_at']) }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $m['tipo'] }}</td>
                        <td align="right" style="border:1px solid #e2e8f0;font-weight:bold;white-space:nowrap;">{{ $money($m['amount']) }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $m['client'] ?: '-' }}</td>
                        <td style="border:1px solid #e2e8f0;">
                            {{ $m['machine'] ? 'Máq. ' . $m['machine'] : ($m['expense_type'] ?: '-') }}
                        </td>
                        <td style="border:1px solid #e2e8f0;">{{ $m['origen'] }}</td>
                        <td style="border:1px solid #e2e8f0;">{{ $m['usuario'] ?: '-' }}</td>
                    </tr>
                    @if (!empty($m['ediciones']))
                        <tr>
                            <td colspan="7" style="border:1px solid #e2e8f0;background:#fffbeb;color:#92400e;font-size:11px;">
                                <strong>Correcciones ({{ count($m['ediciones']) }}):</strong>
                                @foreach ($m['ediciones'] as $e)
                                    <div>
                                        {{ implode(' · ', $e['cambios']) }}
                                        — {{ $e['user'] ?: 'usuario desconocido' }}, {{ $fecha($e['at']) }}
                                    </div>
                                @endforeach
                            </td>
                        </tr>
                    @endif
                @endforeach
            </table>
        @endif

        <p style="margin:22px 0 0;color:#94a3b8;font-size:11px;">
            Reporte automático del sistema de caja. Todas las horas están en horario de Chile.
        </p>
    </div>
</div>
</body>
</html>
