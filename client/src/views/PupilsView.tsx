import React from 'react';
import { useTranslation } from 'react-i18next';
import { Paper, Table, TableCell, TableContainer, TableHead, TableRow, TableBody } from '@mui/material';
import Page from '../components/Page';
import Text from '../components/Text';
import { usePupils } from '../hooks/usePupils';

const PupilsView = () => {
  const { t } = useTranslation();
  const { pupils } = usePupils();

  return (
    <Page title={t('MyBrute')} headerUrl="/">
      <Paper sx={{
        mx: 4,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
      >
        <Text h3 bold upperCase typo="handwritten">{t('My pupils')}</Text>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>{t('Pupil Name')}</TableCell>
                <TableCell>{t('Pupil ID')}</TableCell> 
                <TableCell align="right">{t('Level')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pupils.map((pupil) => (
                <TableRow key={pupil.id}>
                  <TableCell>{pupil.name}</TableCell>
                  <TableCell>{pupil.id}</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Page>
  );
};

export default PupilsView;