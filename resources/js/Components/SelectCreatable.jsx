import { useState } from 'react';
import { Select, Divider, Button, Spin, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

/**
 * Select que además deja crear la opción que falta, sin salir del formulario.
 *
 * Escribís el nombre; si no existe, abajo de la lista aparece "Agregar «lo que
 * escribiste»". Al confirmar se crea contra el backend y queda seleccionado.
 *
 * `onCreate` recibe el texto escrito y tiene que devolver la opción nueva
 * ({ value, label }) o null si falló.
 */
export default function SelectCreatable({
  value,
  onChange,
  options = [],
  onCreate,
  placeholder,
  createLabel = (texto) => `Agregar "${texto}"`,
  disabled = false,
  allowClear = true,
  listHeight = 200,
  ...rest
}) {
  const [texto, setTexto] = useState('');
  const [creando, setCreando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const buscado = texto.trim();

  // Solo ofrecemos crear si lo escrito no coincide ya con una opción: si no,
  // el botón invita a duplicar algo que está a la vista.
  const yaExiste = options.some(
    (o) => String(o.label).trim().toLowerCase() === buscado.toLowerCase(),
  );
  const puedeCrear = Boolean(onCreate) && buscado.length > 1 && !yaExiste;

  const crear = async () => {
    setCreando(true);
    try {
      const nueva = await onCreate(buscado);

      if (nueva?.value !== undefined) {
        onChange?.(nueva.value, nueva);
        setTexto('');
        setAbierto(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'No se pudo crear');
    } finally {
      setCreando(false);
    }
  };

  return (
    <Select
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      value={value}
      onChange={(v, opcion) => {
        // Con searchValue controlado, antd no limpia el texto al elegir: si no
        // lo limpiamos queda filtrando la lista la próxima vez que se abre.
        setTexto('');
        onChange?.(v, opcion);
      }}
      options={options}
      placeholder={placeholder}
      listHeight={listHeight}
      optionFilterProp="label"
      searchValue={texto}
      onSearch={setTexto}
      open={abierto}
      onDropdownVisibleChange={setAbierto}
      onBlur={() => setTexto('')}
      // Ojo: con notFoundContent en null y la lista vacía, rc-select directamente
      // no monta el dropdown y el botón de abajo nunca llega a verse.
      notFoundContent={
        puedeCrear ? (
          <div style={{ padding: '6px 12px', color: '#94a3b8', fontSize: 12 }}>
            No existe todavía
          </div>
        ) : (
          'Sin resultados'
        )
      }
      dropdownRender={(menu) => (
        <>
          {menu}
          {puedeCrear && (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ padding: '0 4px 4px' }}>
                <Button
                  type="text"
                  block
                  icon={creando ? <Spin size="small" /> : <PlusOutlined />}
                  disabled={creando}
                  // Sin esto el select pierde el foco y se cierra antes del click
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={crear}
                  style={{ textAlign: 'left', height: 36 }}
                >
                  {createLabel(buscado)}
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {...rest}
    />
  );
}
