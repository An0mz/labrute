import { Fighter, FightWithBrutes } from '@labrute/core';
import { Close } from '@mui/icons-material';
import { Box, Paper, useMediaQuery } from '@mui/material';
import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import BruteTooltip from '../components/Brute/BruteTooltip';
import FantasyButton from '../components/FantasyButton';
import Page from '../components/Page';
import StyledButton, { StyledButtonHeight, StyledButtonWidth } from '../components/StyledButton';
import Text from '../components/Text';
import { useAuth } from '../hooks/useAuth';
import { useBrute } from '../hooks/useBrute';
import useStateAsync from '../hooks/useStateAsync';
import Server from '../utils/Server';
import TournamentMobileView from './mobile/TournamentMobileView';
import BruteRender from '../components/Brute/Body/BruteRender';

const scale = (base: number, round: number) => ((round === 0 || round === 10)
  ? base * 0.5
  : (round === 1 || round === 9)
    ? base * 0.6
    : (round === 2 || round === 8)
      ? base * 0.6
      : (round === 3 || round === 7)
        ? base * 0.6
        : (round === 4 || round === 6)
          ? base * 0.8
          : base);

const TournamentView = () => {
  const { t } = useTranslation();
  const { bruteName, date } = useParams();
  const { user, authing } = useAuth();
  const navigate = useNavigate();
  const smallScreen = useMediaQuery('(max-width: 935px)');
  const { brute, updateBrute } = useBrute();

  const tournamentProps = useMemo(() => ({ name: bruteName || '', date: date || '' }), [bruteName, date]);
  const { data: tournament } = useStateAsync(null, Server.Tournament.getDaily, tournamentProps);

  const stepWatched = useMemo(() => {
    if (!tournament?.date) return 0;
    if (!brute?.currentTournamentDate) return 0;
    if (!moment.utc(tournament.date).isSame(moment.utc(), 'day')) return 6;

    return brute?.currentTournamentStepWatched || 0;
  }, [brute, tournament]);

  const ownsBrute = useMemo(() => (authing
    || !!(brute && user && brute.userId === user.id)), [authing, brute, user]);

  const winnerStep = useMemo(
    () => tournament?.steps.find((step) => step.step === 63),
    [tournament],
  );

  const winnerStepFighters = useMemo(() => (winnerStep
    ? JSON.parse(winnerStep.fight.fighters) as Fighter[]
    : undefined), [winnerStep]);

  const [display, setDisplay] = React.useState(false);

  // Wait 1s before displaying the tournament
  React.useEffect(() => {
    const timeout = setTimeout(() => setDisplay(true), 1000);
    return () => clearTimeout(timeout);
  }, []);

  const rounds = useMemo(() => {
    if (!tournament) return [];
    const result: typeof tournament.steps[] = [];

    // First round
    result[0] = tournament.steps.filter((step) => step.step <= 16);
    result[10] = tournament.steps.filter((step) => step.step > 16 && step.step <= 32);

    // Second round
    result[1] = tournament.steps.filter((step) => step.step > 32 && step.step <= 40);
    result[9] = tournament.steps.filter((step) => step.step > 40 && step.step <= 48);

    // Third round
    result[2] = tournament.steps.filter((step) => step.step > 48 && step.step <= 52);
    result[8] = tournament.steps.filter((step) => step.step > 52 && step.step <= 56);

    // Fourth round
    result[3] = tournament.steps.filter((step) => step.step > 56 && step.step <= 58);
    result[7] = tournament.steps.filter((step) => step.step > 58 && step.step <= 60);

    // Fifth round
    result[4] = tournament.steps.filter((step) => step.step > 60 && step.step <= 61);
    result[6] = tournament.steps.filter((step) => step.step > 61 && step.step <= 62);

    // Sixth round
    result[5] = tournament.steps.filter((step) => step.step === 63);

    // Order every round by step low to high
    result.forEach((round) => round.sort((a, b) => a.step - b.step));

    return result;
  }, [tournament]);

  const goToFight = useCallback((fight: FightWithBrutes, newStep: number) => () => {
    if (!brute) return;

    navigate(`/${fight.brute1.name}/fight/${fight.id}`);

    if (!ownsBrute) return;
    if (fight.brute1Id !== brute.id && fight.brute2Id !== brute.id) return;
    if (brute.currentTournamentDate && moment.utc(brute.currentTournamentDate).isSame(moment.utc(), 'day')) {
      if (newStep <= (brute.currentTournamentStepWatched || 0)) return;
    }

    // Update watched step
    Server.Tournament.updateStepWatched(bruteName || '').catch(console.error);
  }, [brute, bruteName, navigate, ownsBrute]);

  const setWatched = useCallback(async () => {
    if (!brute) return;

    await Server.Tournament.setDailyWatched(brute.name);

    updateBrute((b) => (b ? {
      ...b,
      currentTournamentDate: moment.utc().startOf('day').toDate(),
      currentTournamentStepWatched: 6,
    } : null));
  }, [brute, updateBrute]);

  return tournament && (smallScreen
    ? (
      <TournamentMobileView
        bruteName={bruteName}
        tournament={tournament}
        winnerStep={winnerStep}
        winnerStepFighters={winnerStepFighters}
        ownsBrute={ownsBrute}
        stepWatched={stepWatched}
        brute={brute}
        display={display}
        goToFight={goToFight}
        setWatched={setWatched}
      />
    ) : (
      <Page title={`${t('tournament')} ${t('MyBrute')}`} headerUrl={`/${bruteName || ''}/cell`}>
        <Paper sx={{
          mx: 4,
          textAlign: 'center',
        }}
        >
          <Text h3 bold upperCase typo="handwritten" sx={{ mr: 2 }}>{t('tournamentOf')} {moment.utc(tournament.date).format('DD MMMM YYYY')}</Text>
        </Paper>
        <Paper sx={{ position: 'relative', bgcolor: 'background.paperLight', mt: -2 }}>
          {ownsBrute && stepWatched < 6 && (
            <FantasyButton onClick={setWatched} color="success">
              {t('setAsWatched')}
            </FantasyButton>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {display && (!authing && brute) && rounds.map((round, index) => {
              const roundNumber = index < 6 ? index : 10 - index;
              const shouldDisplay = ownsBrute
                ? stepWatched >= roundNumber
                : true;
              const shouldResultDisplay = ownsBrute
                ? stepWatched - 1 >= roundNumber
                : true;

              if (!shouldDisplay) {
                return (
                  <Box
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: index === 5 ? 'start' : 'space-around',
                      width: scale(StyledButtonWidth, index),
                      ml: index === 2
                        ? '-60px'
                        : index === 3
                          ? '-80px'
                          : index === 4
                            ? '-130px'
                            : index === 5
                              ? '-110px'
                              : index === 6
                                ? '-110px'
                                : index === 7
                                  ? '-130px'
                                  : index === 8
                                    ? '-80px'
                                    : index === 9
                                      ? '-60px'
                                      : '0px',
                    }}
                  />
                );
              }

              return shouldDisplay && (
                <Box
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: index === 5 ? 'start' : 'space-around',
                    ml: index === 2
                      ? '-60px'
                      : index === 3
                        ? '-80px'
                        : index === 4
                          ? '-130px'
                          : index === 5
                            ? '-110px'
                            : index === 6
                              ? '-110px'
                              : index === 7
                                ? '-130px'
                                : index === 8
                                  ? '-80px'
                                  : index === 9
                                    ? '-60px'
                                    : '0px',
                  }}
                >
                  {round.map((step) => {
                    const fighters = JSON.parse(step.fight.fighters) as Fighter[];

                    return (
                      // Fight button
                      <StyledButton
                        key={step.id}
                        onClick={goToFight(step.fight, index < 6 ? index + 1 : 10 - index + 1)}
                        shadowColor={(bruteName === step.fight.brute1.name
                          || bruteName === step.fight.brute2?.name)
                          ? 'rgba(255, 0, 0, 0.6)'
                          : undefined}
                        sx={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundSize: 'contain',
                          width: scale(StyledButtonWidth, index),
                          height: scale(StyledButtonHeight, index),
                          m: `${scale(8, index)}px`,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Left fighter */}
                        <BruteTooltip
                          fighter={fighters.find((fighter) => fighter.type === 'brute' && fighter.name === step.fight.brute1.name)}
                          brute={step.fight.brute1}
                        >
                          <Box sx={{
                            position: 'relative',
                            height: 1,
                            width: scale(50, index),
                            mr: 1,
                          }}
                          >
                            <BruteRender brute={step.fight.brute1} />
                            {/* Lost indicator */}
                            {shouldResultDisplay
                              && step.fight.winner === step.fight.brute2?.name
                              && (
                                <Close
                                  color="error"
                                  sx={{
                                    position: 'absolute',
                                    top: 5,
                                    left: 0,
                                    width: 1,
                                    height: 1,
                                    zIndex: 3,
                                  }}
                                />
                              )}
                            {/* Rank */}
                            <Box
                              component="img"
                              src={`/images/rankings/lvl_${fighters.find((f) => f.id === step.fight.brute1Id)?.rank || step.fight.brute1.ranking}.png`}
                              sx={{
                                position: 'absolute',
                                bottom: scale(-6, index),
                                right: scale(-18, index),
                                width: scale(30, index),
                                zIndex: 2,
                              }}
                            />
                          </Box>
                        </BruteTooltip>
                        {/* VS */}
                        <Box
                          component="img"
                          src="/images/tournament/vs.svg"
                          sx={{
                            width: scale(45, index),
                          }}
                        />
                        {/* RIGHT FIGHTER */}
                        {step.fight.brute2 && (
                          <BruteTooltip
                            fighter={fighters.find((fighter) => fighter.type === 'brute' && fighter.name === step.fight?.brute2?.name)}
                            brute={step.fight.brute2}
                          >
                            <Box sx={{
                              position: 'relative',
                              height: 1,
                              width: scale(50, index),
                              ml: 1,
                            }}
                            >
                              <BruteRender
                                brute={step.fight.brute2}
                                looking="left"
                              />
                              {/* Lost indicator */}
                              {shouldResultDisplay
                                && step.fight.winner === step.fight.brute1.name
                                && (
                                  <Close
                                    color="error"
                                    sx={{
                                      position: 'absolute',
                                      top: 5,
                                      left: 0,
                                      width: 1,
                                      height: 1,
                                    }}
                                  />
                                )}
                              {/* Rank */}
                              <Box
                                component="img"
                                src={`/images/rankings/lvl_${fighters.find((f) => f.id === step.fight.brute2Id)?.rank || step.fight.brute2.ranking}.png`}
                                sx={{
                                  position: 'absolute',
                                  bottom: scale(-6, index),
                                  left: scale(-18, index),
                                  width: scale(30, index),
                                  transform: 'scaleX(-1)',
                                  zIndex: 2,
                                }}
                              />
                            </Box>
                          </BruteTooltip>
                        )}
                      </StyledButton>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          {/* Tournament winner */}
          {display
            && winnerStep?.fight.brute2
            && winnerStepFighters
            && (!authing && brute)
            && (!ownsBrute || (ownsBrute && stepWatched > 5))
            && (
              <BruteTooltip
                fighter={winnerStep.fight.winner === winnerStep.fight.brute1.name
                  ? winnerStepFighters
                    .find((fighter) => fighter.type === 'brute' && fighter.name === winnerStep.fight.brute1.name)
                  : winnerStepFighters
                    .find((fighter) => fighter.type === 'brute' && fighter.name === winnerStep.fight.brute2?.name)}
                brute={winnerStep.fight.winner === winnerStep.fight.brute1.name
                  ? winnerStep.fight.brute1
                  : winnerStep.fight.brute2}
              >
                <BruteRender
                  brute={winnerStep.fight.winner === winnerStep.fight.brute1.name
                    ? winnerStep.fight.brute1
                    : winnerStep?.fight.brute2}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    mx: 'auto',
                    top: 'initial',
                    width: 100,
                    transformOrigin: 'bottom center',
                  }}
                />
              </BruteTooltip>
            )}
        </Paper>
      </Page>
    ));
};

export default TournamentView;