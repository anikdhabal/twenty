import { gql } from '@apollo/client';

export const UPDATE_VIEW_FIELD = gql`
  mutation UpdateViewField(
    $data: ViewFieldUpdateInput!
    $where: ViewFieldWhereUniqueInput!
  ) {
    updateOneViewField(data: $data, where: $where) {
      index
      isVisible
      key
      name
      size
    }
  }
`;
