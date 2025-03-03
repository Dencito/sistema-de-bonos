export const getBgStatus = (status) => {
    return status === 'Activo'
        ? '#68D391'
        : status === 'Inactivo'
          ? '#F56565'
          : status === 'En revisión'
            ? '#FDBA08'
            : status === 'Borrado'
              ? '#F56565'
              : ''
}