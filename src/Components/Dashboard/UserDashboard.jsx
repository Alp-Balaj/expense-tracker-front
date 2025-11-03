import styled from "styled-components"

const DashboardCard = styled.div`
    width: 100%;
    height: 100%;
    background-color: #E7E7E7;
    border-radius: 10px;
`;

const TextArea = styled.div`
  padding: 20px;
`

const UsernameText = styled.h1`
  font-size: 48px;
  font-weight: 500;
  padding-bottom: 60px;
  margin: 0;
`

const InformationTextArea = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`


const InformationText = styled.h1`
  font-size: 32px;
  font-weight: 500;
  padding-bottom: 40px;
  margin: 0;
` 

function UserDashboard() {
  return (
    <DashboardCard>
      <TextArea>
        
        <UsernameText>Username</UsernameText>

        <InformationTextArea>
          <InformationText>Income:</InformationText>
          <InformationText>???$</InformationText>
        </InformationTextArea>

        <InformationTextArea>
          <InformationText>Expenses:</InformationText>
          <InformationText>???$</InformationText>
        </InformationTextArea>

        <InformationTextArea>
          <InformationText>Savings:</InformationText>
          <InformationText>???$</InformationText>
        </InformationTextArea>

        <InformationTextArea>
          <InformationText>Bills:</InformationText>
          <InformationText>???$</InformationText>
        </InformationTextArea>

      </TextArea>
    </DashboardCard>
  )
}

export default UserDashboard