import { 
  PageButton, 
  PaginationContainer, 
  BooleanStatus, 
  Container, 
  StyledTable, 
  THead, 
  TBody, 
  Td, 
  Th, 
  FilterInput, 
  BooleanLabel,
  PageTitle 
} from './StyledComponents';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GeneralEditor from './GeneralEditor';
import { useAppAuthApi } from '../../Hooks/useAppAuthApi';
import ConfirmDialog from './ConfirmDialog';
import { getEnumOptions, getEnumDisplayValue } from '../../Services/enumServices.jsx';
import { MultiSelectFilter } from './MultiSelectFilter/MultiSelectFilter.jsx';

const TriStateCheckbox = ({ value, onChange, label }) => {
  const checkboxRef = useRef();


  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = value === null;
    }
  });

  const handleClick = () => {
    if (value === null) {
      onChange(true);
    } else if (value === true) {
      onChange(false);
    } else {
      onChange(null);
    }
  };

  return (
    <BooleanLabel>
      {label}:
      <input
        type="checkbox"
        ref={checkboxRef}
        checked={value === true}
        onChange={handleClick}
      />
      <BooleanStatus>{value === null ? 'Any' : value.toString()}</BooleanStatus>
    </BooleanLabel>
  );
};

const GeneralTableList = ({ title, tableSettings, editForm }) => {
  
  const { getAllData, deleteData, putData, postData } = useAppAuthApi();

  const { columns, url, editFormStyle, editable, deletable } = tableSettings;
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllData(url);
      setData(data);
    };
  
    fetchData();
  }, []);
  
  const reloadTable = () => {
    getAllData(url).then((data) => {
      setData(data);
    })
  }

  const [currentRow, setCurrentRow] = useState([]);

  const [sortConfig, setSortConfig] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick') {
      setModalOpen(false);
      setIsEditing(false);
    }
  };

  const onDelete = (row) => {
    handleOpenDialog();
    setCurrentRow(row);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConfirmAction = () => {
    handleDeleteRow(currentRow)
    setDialogOpen(false);
  };

  const handleDeleteRow = (row) => {
    deleteData(url+`/${row.id}`).then(() => {
      reloadTable();
      setCurrentRow([]);
    })
    .catch((error) => console.log(error))
  };

  const onEdit = (row) => {
    setCurrentRow(row);
    setIsEditing(true);
    setModalOpen(true);
  };

  const onAdd = (row) => {
    setCurrentRow(null);
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleSort = (accessor) => {
    if (!sortConfig || sortConfig.key !== accessor) {
      setSortConfig({ key: accessor, direction: 'ascending' });
    } else if (sortConfig.direction === 'ascending') {
      setSortConfig({ key: accessor, direction: 'descending' });
    } else if (sortConfig.direction === 'descending') {
      setSortConfig(null);
    }
  };
  

  const handleFilterChange = (accessor, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [accessor]: value,
    }));
    setCurrentPage(1);
  };

  const renderFilter = (col) => {
    if (!col.filterable) return null;
  
    switch (col.type) {
      case 'enum':
        const options = col.enumType 
          ? getEnumOptions(col.enumType) 
          : (col.options || []).map(opt => ({ 
              value: opt.value !== undefined ? opt.value : opt, 
              label: opt.label !== undefined ? opt.label : opt 
            }));
        
        return (
          <MultiSelectFilter
            accessor={col.accessor}
            enumType={col.enumType}
            value={filters[col.accessor] || []}
            onChange={(newValue) => handleFilterChange(col.accessor, newValue)}
          />
        );

      case 'boolean':
        return (
          <TriStateCheckbox
            value={filters[col.accessor] === undefined ? null : filters[col.accessor]}
            onChange={(newValue) => handleFilterChange(col.accessor, newValue)}
            label={`Filter ${col.header}`}
          />
        );

      default:
        return (
          <FilterInput
            type="text"
            placeholder={`Filter ${col.header}`}
            value={filters[col.accessor] || ''}
            onChange={(e) => handleFilterChange(col.accessor, e.target.value)}
          />
        );
    }
  };

  const processedData = useMemo(() => {
    const filtered = data.filter((row) => {
      return columns.every((col) => {
        const filterValue = filters[col.accessor];
        
        if (!filterValue || filterValue.length === 0) {
          return true;
        }
        
        const cellValue = row[col.accessor];
        
        if (col.type === 'enum') {
          return filterValue.includes(cellValue);
        }
        return cellValue && cellValue.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
      });
    });

    if (sortConfig) {
      const { key, direction } = sortConfig;
      filtered.sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];

        const column = columns.find((col) => col.accessor === key);
        if (column) {
          if (column && column.type === 'enum' && column.enumType) {
            const enumOptions = getEnumOptions(column.enumType);
            valueA = enumOptions.findIndex(opt => opt.value === valueA);
            valueB = enumOptions.findIndex(opt => opt.value === valueB);
            if (valueA === -1) valueA = enumOptions.length;
            if (valueB === -1) valueB = enumOptions.length;
          }
          else if (column.type === 'number') {
            valueA = parseFloat(valueA);
            valueB = parseFloat(valueB);
          } else if (column.type === 'date') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
          } else {
            valueA = valueA.toString().toLowerCase();
            valueB = valueB.toString().toLowerCase();
          }
        }

        if (valueA < valueB) return direction === 'ascending' ? -1 : 1;
        if (valueA > valueB) return direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, filters, sortConfig, columns]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedData, currentPage]);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  //api Callls for update/add and delete
  
  const handleEditorSubmit = (formData) => {
    const request = isEditing?
        putData(`${url}/${currentRow.id}`, formData) :
        postData(url, formData);
  
    request.then(() => 
      {
        setCurrentRow([]);
        reloadTable();
        setModalOpen(false);
        setIsEditing(false);
      })
      .catch((error) => console.log(error));
  };

  return (
    <div style={{
      backgroundColor: '#1E2A47 ',
      borderRadius: '5px',
      padding: '15px'}}>
      <PageTitle>
        <h2 className="text-2xl font-bold" style={{color: 'white'}}>{title}</h2>
        <Button
          sx={{
            padding: '10px 20px',
            backgroundColor: '#1E2A47',
            color: '#fff',
            borderRadius: '6px',
            '&:hover': { 
              backgroundColor: '#07122d',
              boxShadow: 'inset 0px 0px 9px 1px #00e4ff6e'
             },
          }}
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
        Add
        </Button>
      </PageTitle>
      <Container className='containerScroll'>
        <StyledTable>
          <THead>
            <tr>
              {columns.map((col) => (
                <Th key={col.accessor}>
                  {sortConfig?.key === col.accessor && (
                    sortConfig.direction === 'ascending'
                      ? ' 🔼'
                      : sortConfig.direction === 'descending'
                      ? ' 🔽'
                      : ''
                  )}
                  <span onClick={() => handleSort(col.accessor)}>
                    {col.header}
                  </span>
                  <div>{renderFilter(col)}</div>
                </Th>
              ))}
              {(editable || deletable ) && <Th>
                Actions  
              </Th>}
            </tr>
            <tr>
              
            </tr>
          </THead>
          <TBody>
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <Td key={col.accessor}>
                    {col.type === 'enum' && col.enumType 
                      ? getEnumDisplayValue(col.enumType, row[col.accessor])
                      : row[col.accessor]}
                  </Td>
                ))}
                
                {(editable || deletable) && (
                  <Td>
                    {editable && (
                      <IconButton style={{ color: 'white' }} aria-label="delete" onClick={() => onEdit(row)}>
                        <EditIcon />
                      </IconButton>
                    )}
                    {deletable && (
                      <IconButton style={{ color: 'red' }} aria-label="delete" onClick={() => onDelete(row)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Td>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <Td colSpan={columns.length + (editable || deletable ? 1 : 0)}>No matching records found.</Td>
              </tr>
            )}
          </TBody>
        </StyledTable>
        
        {totalPages > 1 && (
          <PaginationContainer>
            <PageButton 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              Previous
            </PageButton>

            {Array.from({ length: totalPages }, (_, index) => {
              const pageNum = index + 1;
              return (
                <PageButton
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  disabled={currentPage === pageNum}
                >
                  {pageNum}
                </PageButton>
              );
            })}

            <PageButton 
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next
            </PageButton>
          </PaginationContainer>
        )}
      </Container>
      {editForm && (
        <GeneralEditor open={modalOpen} handleClose={handleClose} title={title} onSubmit={handleEditorSubmit} editing={isEditing} data={currentRow} sx={editFormStyle} style={{height: "fit-content"}}>
          {React.cloneElement(editForm)}
        </GeneralEditor>
      )}
      <ConfirmDialog 
        open={dialogOpen}
        title="Confirm Deletion"
        content="Are you sure you want to delete this item?"
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default GeneralTableList;
