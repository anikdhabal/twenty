import { useContext, useRef, useState } from 'react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useRecoilCallback, useRecoilState, useRecoilValue } from 'recoil';
import { Key } from 'ts-key-enum';
import { v4 } from 'uuid';

import { BoardContext } from '@/companies/states/contexts/BoardContext';
import { DropdownMenuHeader } from '@/ui/dropdown/components/DropdownMenuHeader';
import { DropdownMenuInput } from '@/ui/dropdown/components/DropdownMenuInput';
import { StyledDropdownMenu } from '@/ui/dropdown/components/StyledDropdownMenu';
import { StyledDropdownMenuItemsContainer } from '@/ui/dropdown/components/StyledDropdownMenuItemsContainer';
import { StyledDropdownMenuSeparator } from '@/ui/dropdown/components/StyledDropdownMenuSeparator';
import { useDropdownButton } from '@/ui/dropdown/hooks/useDropdownButton';
import {
  IconChevronLeft,
  IconLayoutKanban,
  IconPlus,
  IconSettings,
  IconTag,
} from '@/ui/icon';
import { MenuItem } from '@/ui/menu-item/components/MenuItem';
import { MenuItemNavigate } from '@/ui/menu-item/components/MenuItemNavigate';
import { ThemeColor } from '@/ui/theme/constants/colors';
import { useScopedHotkeys } from '@/ui/utilities/hotkey/hooks/useScopedHotkeys';
import { HotkeyScope } from '@/ui/utilities/hotkey/types/HotkeyScope';
import { useRecoilScopedValue } from '@/ui/utilities/recoil-scope/hooks/useRecoilScopedValue';
import { useRecoilScopeId } from '@/ui/utilities/recoil-scope/hooks/useRecoilScopeId';
import { ViewFieldsVisibilityDropdownSection } from '@/ui/view-bar/components/ViewFieldsVisibilityDropdownSection';
import { useUpsertView } from '@/ui/view-bar/hooks/useUpsertView';
import { viewsByIdScopedSelector } from '@/ui/view-bar/states/selectors/viewsByIdScopedSelector';
import { viewEditModeState } from '@/ui/view-bar/states/viewEditModeState';

import { useBoardCardFields } from '../hooks/useBoardCardFields';
import { boardCardFieldsScopedState } from '../states/boardCardFieldsScopedState';
import { boardColumnsState } from '../states/boardColumnsState';
import { savedBoardCardFieldsFamilyState } from '../states/savedBoardCardFieldsFamilyState';
import { hiddenBoardCardFieldsScopedSelector } from '../states/selectors/hiddenBoardCardFieldsScopedSelector';
import { visibleBoardCardFieldsScopedSelector } from '../states/selectors/visibleBoardCardFieldsScopedSelector';
import type { BoardColumnDefinition } from '../types/BoardColumnDefinition';
import { BoardOptionsDropdownKey } from '../types/BoardOptionsDropdownKey';

export type BoardOptionsDropdownContentProps = {
  customHotkeyScope: HotkeyScope;
  onStageAdd?: (boardColumn: BoardColumnDefinition) => void;
};

const StyledIconSettings = styled(IconSettings)`
  margin-right: ${({ theme }) => theme.spacing(1)};
`;

type BoardOptionsMenu = 'fields' | 'stage-creation' | 'stages';

type ColumnForCreate = {
  id: string;
  colorCode: ThemeColor;
  index: number;
  title: string;
};

export const BoardOptionsDropdownContent = ({
  customHotkeyScope,
  onStageAdd,
}: BoardOptionsDropdownContentProps) => {
  const theme = useTheme();

  const BoardRecoilScopeContext =
    useContext(BoardContext).BoardRecoilScopeContext;

  const boardRecoilScopeId = useRecoilScopeId(BoardRecoilScopeContext);

  const stageInputRef = useRef<HTMLInputElement>(null);
  const viewEditInputRef = useRef<HTMLInputElement>(null);

  const [currentMenu, setCurrentMenu] = useState<
    BoardOptionsMenu | undefined
  >();

  const [boardColumns, setBoardColumns] = useRecoilState(boardColumnsState);

  const hiddenBoardCardFields = useRecoilScopedValue(
    hiddenBoardCardFieldsScopedSelector,
    BoardRecoilScopeContext,
  );
  const hasHiddenFields = hiddenBoardCardFields.length > 0;
  const visibleBoardCardFields = useRecoilScopedValue(
    visibleBoardCardFieldsScopedSelector,
    BoardRecoilScopeContext,
  );
  const hasVisibleFields = visibleBoardCardFields.length > 0;

  const viewsById = useRecoilScopedValue(
    viewsByIdScopedSelector,
    BoardRecoilScopeContext, // TODO: replace with ViewBarRecoilScopeContext
  );
  const viewEditMode = useRecoilValue(viewEditModeState);

  const handleStageSubmit = () => {
    if (currentMenu !== 'stage-creation' || !stageInputRef?.current?.value)
      return;

    const columnToCreate: ColumnForCreate = {
      id: v4(),
      colorCode: 'gray',
      index: boardColumns.length,
      title: stageInputRef.current.value,
    };

    setBoardColumns((previousBoardColumns) => [
      ...previousBoardColumns,
      columnToCreate,
    ]);
    onStageAdd?.(columnToCreate);
  };

  const { upsertView } = useUpsertView();

  const handleViewNameSubmit = useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        const boardCardFields = await snapshot.getPromise(
          boardCardFieldsScopedState(boardRecoilScopeId),
        );
        const isCreateMode = viewEditMode.mode === 'create';
        const name = viewEditInputRef.current?.value;
        const view = await upsertView(name);

        if (view && isCreateMode) {
          set(savedBoardCardFieldsFamilyState(view.id), boardCardFields);
        }
      },
    [boardRecoilScopeId, upsertView, viewEditMode.mode],
  );

  const resetMenu = () => setCurrentMenu(undefined);

  const handleMenuNavigate = (menu: BoardOptionsMenu) => {
    handleViewNameSubmit();
    setCurrentMenu(menu);
  };

  const { handleFieldVisibilityChange } = useBoardCardFields();

  const { closeDropdownButton } = useDropdownButton({
    dropdownId: BoardOptionsDropdownKey,
  });

  useScopedHotkeys(
    Key.Escape,
    () => {
      closeDropdownButton();
    },
    customHotkeyScope.scope,
  );

  useScopedHotkeys(
    Key.Enter,
    () => {
      handleStageSubmit();
      handleViewNameSubmit();
      closeDropdownButton();
    },
    customHotkeyScope.scope,
  );

  return (
    <StyledDropdownMenu>
      {!currentMenu && (
        <>
          {!!viewEditMode.mode ? (
            <DropdownMenuInput
              ref={viewEditInputRef}
              autoFocus
              placeholder={
                viewEditMode.mode === 'create' ? 'New view' : 'View name'
              }
              defaultValue={
                viewEditMode.viewId
                  ? viewsById[viewEditMode.viewId]?.name
                  : undefined
              }
            />
          ) : (
            <DropdownMenuHeader>
              <StyledIconSettings size={theme.icon.size.md} />
              Settings
            </DropdownMenuHeader>
          )}
          <StyledDropdownMenuSeparator />
          <StyledDropdownMenuItemsContainer>
            <MenuItemNavigate
              onClick={() => handleMenuNavigate('fields')}
              LeftIcon={IconTag}
              text="Fields"
            />
            <MenuItemNavigate
              onClick={() => handleMenuNavigate('stages')}
              LeftIcon={IconLayoutKanban}
              text="Stages"
            />
          </StyledDropdownMenuItemsContainer>
        </>
      )}
      {currentMenu === 'stages' && (
        <>
          <DropdownMenuHeader StartIcon={IconChevronLeft} onClick={resetMenu}>
            Stages
          </DropdownMenuHeader>
          <StyledDropdownMenuSeparator />
          <StyledDropdownMenuItemsContainer>
            <MenuItem
              onClick={() => setCurrentMenu('stage-creation')}
              LeftIcon={IconPlus}
              text="Add stage"
            />
          </StyledDropdownMenuItemsContainer>
        </>
      )}
      {currentMenu === 'stage-creation' && (
        <DropdownMenuInput
          autoFocus
          placeholder="New stage"
          ref={stageInputRef}
        />
      )}
      {currentMenu === 'fields' && (
        <>
          <DropdownMenuHeader StartIcon={IconChevronLeft} onClick={resetMenu}>
            Fields
          </DropdownMenuHeader>
          <StyledDropdownMenuSeparator />
          {hasVisibleFields && (
            <ViewFieldsVisibilityDropdownSection
              title="Visible"
              fields={visibleBoardCardFields}
              onVisibilityChange={handleFieldVisibilityChange}
            />
          )}
          {hasVisibleFields && hasHiddenFields && (
            <StyledDropdownMenuSeparator />
          )}
          {hasHiddenFields && (
            <ViewFieldsVisibilityDropdownSection
              title="Hidden"
              fields={hiddenBoardCardFields}
              onVisibilityChange={handleFieldVisibilityChange}
            />
          )}
        </>
      )}
    </StyledDropdownMenu>
  );
};
