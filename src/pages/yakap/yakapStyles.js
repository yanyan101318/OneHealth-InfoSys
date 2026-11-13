export const dataGridDarkSx = {
  backgroundColor: 'var(--datagrid-bg)',
  border: '1px solid var(--datagrid-border)',
  color: 'var(--datagrid-text)',
  borderRadius: '0.75rem',
  fontFamily: 'inherit',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  '& .MuiDataGrid-main': {
    backgroundColor: 'var(--datagrid-bg)',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'var(--datagrid-header-bg)',
    borderBottom: '1px solid var(--datagrid-header-border)',
    color: 'var(--datagrid-header-color)',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: 'var(--datagrid-header-bg)',
    '&:focus, &:focus-within': {
      outline: 'none',
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    color: 'var(--datagrid-header-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  '& .MuiDataGrid-row': {
    borderBottom: '1px solid var(--datagrid-row-border)',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: 'var(--datagrid-row-hover)',
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
      },
    },
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid var(--datagrid-row-border)',
    color: 'var(--datagrid-cell-text)',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    '&:focus, &:focus-within': {
      outline: 'none',
    },
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: 'var(--datagrid-footer-bg)',
    borderTop: '1px solid var(--datagrid-header-border)',
    color: 'var(--datagrid-header-color)',
  },
  '& .MuiTablePagination-root': {
    color: 'var(--datagrid-header-color)',
  },
  '& .MuiTablePagination-select': {
    color: 'var(--datagrid-text)',
  },
  '& .MuiTablePagination-actions button': {
    color: 'var(--datagrid-header-color)',
    '&:disabled': {
      color: '#94a3b8',
      opacity: 0.5,
    },
  },
  '& .MuiTablePagination-selectIcon': {
    color: 'var(--datagrid-header-color)',
  },
  '& .MuiCheckbox-root': {
    color: 'var(--datagrid-header-color)',
    '&.Mui-checked': {
      color: '#3b82f6',
    },
    '&.MuiCheckbox-indeterminate': {
      color: '#3b82f6',
    },
  },
  '& .MuiDataGrid-iconSeparator': {
    color: 'var(--datagrid-border)',
  },
  '& .MuiDataGrid-menuIcon button, & .MuiDataGrid-sortIcon': {
    color: 'var(--datagrid-header-color)',
  },
  '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
    background: 'var(--datagrid-bg)',
  },
  '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
    background: 'var(--datagrid-header-color)',
    borderRadius: '3px',
  },
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'var(--datagrid-bg)',
    color: 'var(--datagrid-header-color)',
  },
}
