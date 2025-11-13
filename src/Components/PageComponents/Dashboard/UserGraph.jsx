import styled from "styled-components"

const GraphCard = styled.div`
  width: 100%;
  height: 100%;
  background-color: #E7E7E7;
  border-radius: 10px;
`;

const H1 = styled.h1`
    padding: 0;
    margin: 0;
`

function UserGraph() {
  return (
    <GraphCard>
        <H1>Graph</H1>
    </GraphCard>
  )
}

export default UserGraph