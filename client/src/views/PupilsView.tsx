import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../hooks/useAlert';
import Server from '../utils/Server';
import catchError from '../utils/catchError';
import { BruteWithBodyColors } from '@labrute/core';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Page from '../components/Page';
import Text from '../components/Text';

const PupilsView = () => {
  const { t } = useTranslation();
  const { bruteName } = useParams();
  const Alert = useAlert();
  const [pupils, setPupils] = useState<BruteWithBodyColors[]>([]);

  useEffect(() => {
    if (bruteName) {
      Server.Brute.getPupils(bruteName)
        .then(setPupils)
        .catch((error) => {
          catchError(Alert)(error);
          setPupils([]);
        });
    }
  }, [Alert, bruteName]);

  return (
    <Page title={t('MyBrute')} headerUrl="/">
      <Paper sx={{ mx: 4, my: 2, p: 2 }}>
        <Text h3 bold upperCase typo="handwritten">{t('pupilsTitle')}</Text>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>{t('Pupil Name')}</TableCell>
                <TableCell align="right">{t('Level')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pupils.map((pupil) => (
                <TableRow
                  key={pupil.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {pupil.name}
                  </TableCell>
                  <TableCell align="right">{pupil.level}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {pupils.length === 0 && <Text>{t('noPupils')}</Text>}
      </Paper>
    </Page>
  );
};

export default PupilsView;
