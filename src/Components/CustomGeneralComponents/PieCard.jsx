import styled from "styled-components";

const Card = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  background-color: #E7E7E7;
  border-radius: 10px;
`

function PieCard ({children}) {
  return (
    <Card>
      {children}
    </Card>
  )}

export default PieCard;