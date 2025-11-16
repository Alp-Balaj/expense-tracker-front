import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
  overflow-x: auto;
  box-shadow: #000c31 0px 0px 20px 1px;
`;

export const StyledTable = styled.table`
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
`;

export const THead = styled.thead`
  background-color: #101830;
  color: white;
`;

export const TBody = styled.tbody``;

export const Th = styled.th`
  padding: 12px;
  min-width: 150px;
  max-width: 150px;
  border: 1px solid #ddd;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; 
  cursor: pointer;

  div {
    white-space: nowrap; 
  }
`;


export const Td = styled.td`
  padding: 12px;
  border: 1px solid #ddd;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;


export const FilterInput = styled.input`
  margin-top: 8px;
  width: 100%;
  padding: 4px;
  white-space: nowrap;
  border: 1px solid white !important;
  border-radius: 5px;
  background-color: white;
  height: 35px;
`;

export const FilterSelect = styled.select`
  margin-top: 8px;
  width: 100%;
  padding: 4px;
  white-space: nowrap;
`;

export const BooleanLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;

export const BooleanStatus = styled.span`
  margin-left: 4px;
`;

export const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
`;

export const PageButton = styled.button`
  margin: 0 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const PageTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
`

export const PieCard = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #E7E7E7;
  border-radius: 10px;
`