import React from "react";
import createReactClass from "create-react-class";
import { ThemeProvider, createGlobalStyle } from "styled-components";
import PropTypes from "prop-types";
import combine from "terriajs-cesium/Source/Core/combine";

import { BrowserRouter as Router, Route, withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import {
  CATALOG_ROUTE,
  CATALOG_MEMBER_ROUTE
} from "../../ReactViewModels/TerriaRouting";

import { terriaTheme } from "./StandardTheme";
import arrayContains from "../../Core/arrayContains";
import Branding from "../SidePanel/Branding";
import DragDropFile from "../DragDropFile";
import DragDropNotification from "./../DragDropNotification";
import ExplorerWindow from "../ExplorerWindow/ExplorerWindow";
import FeatureInfoPanel from "../FeatureInfo/FeatureInfoPanel";
import FeedbackForm from "../Feedback/FeedbackForm";
import MapColumn from "./MapColumn";
import MapInteractionWindow from "../Notification/MapInteractionWindow";
import TrainerBar from "../Map/TrainerBar/TrainerBar";
import ExperimentalFeatures from "../Map/ExperimentalFeatures";
import MobileHeader from "../Mobile/MobileHeader";
import Notification from "../Notification/Notification";
import ProgressBar from "../Map/ProgressBar";
import SidePanel from "../SidePanel/SidePanel";

import RoutingListener from "./RoutingListener.jsx";
import processCustomElements from "./processCustomElements";
import FullScreenButton from "./../SidePanel/FullScreenButton.jsx";
import StoryPanel from "./../Story/StoryPanel.jsx";
import StoryBuilder from "./../Story/StoryBuilder.jsx";

import withFallback from "../HOCs/withFallback";
import TourPortal from "../Tour/TourPortal";
import SatelliteHelpPrompt from "../HelpScreens/SatelliteHelpPrompt";
import WelcomeMessage from "../WelcomeMessage/WelcomeMessage";
import withRoutingTracker from "./withRoutingTracker";
// import SatelliteGuide from "../Guide/SatelliteGuide.jsx";

import { Small, Medium } from "../Generic/Responsive";
import classNames from "classnames";
import "inobounce";

import { withTranslation } from "react-i18next";

import Styles from "./standard-user-interface.scss";
// import Variables from "../../Sass/common/variables";
import { observer } from "mobx-react";
import { action, runInAction } from "mobx";
import HelpPanel from "../Map/Panels/HelpPanel/HelpPanel";
import Tool from "../Tool";
import Disclaimer from "../Disclaimer";

export const showStoryPrompt = (viewState, terria) => {
  terria.configParameters.showFeaturePrompts &&
    terria.configParameters.storyEnabled &&
    terria.stories.length === 0 &&
    viewState.toggleFeaturePrompt("story", true);
};
const GlobalTerriaStyles = createGlobalStyle`
  // Theme-ify sass classes until they are removed

  // We override the primary, secondary, map and share buttons here as they
  // are imported everywhere and used in various ways - until we remove sass
  // this is the quickest way to tackle them for now
  .tjs-_buttons__btn--map {
    ${p => p.theme.addTerriaMapBtnStyles(p)}
  }

  .tjs-_buttons__btn-primary {
    ${p => p.theme.addTerriaPrimaryBtnStyles(p)}
  }

  .tjs-_buttons__btn--secondary,
  .tjs-_buttons__btn--close-modal {
    ${p => p.theme.addTerriaSecondaryBtnStyles(p)}
  }

  .tjs-_buttons__btn--tertiary {
    ${p => p.theme.addTerriaTertiaryBtnStyles(p)}
  }

  .tjs-_buttons__btn-small:hover,
  .tjs-_buttons__btn-small:focus {
    color: ${p => p.theme.colorPrimary};
  }

  .tjs-share-panel__catalog-share-inner {
    background: ${p => p.theme.greyLightest};
  }

  .tjs-share-panel__btn--catalogShare {
    color: ${p => p.theme.colorPrimary};
    background:transparent;
    svg {
      fill: ${p => p.theme.colorPrimary};
    }
  }
  .tjs-dropdown__btn--dropdown {
    color: ${p => p.theme.textDark};
    background: ${p => p.theme.textLight};
    &:hover,
    &:focus {
      color: ${p => p.theme.textDark};
      background: ${p => p.theme.textLight};
      border: 1px solid ${p => p.theme.colorPrimary};
    }
    svg {
      fill: ${p => p.theme.textDark};
    }
  }
  .tjs-dropdown__btn--option.tjs-dropdown__is-selected {
    color: ${p => p.theme.colorPrimary};
  }


  ${props =>
    props.experimentalFeatures &&
    `
    body {
      *:focus {
        outline: 3px solid #C390F9;
      }
    }
  `}
`;
const animationDuration = 250;
/** blah */
const StandardUserInterfaceRaw = observer(
  createReactClass({
    displayName: "StandardUserInterface",

    propTypes: {
      /**
       * Terria instance
       */
      terria: PropTypes.object.isRequired,
      /**
       * All the base maps.
       */
      allBaseMaps: PropTypes.array,
      themeOverrides: PropTypes.object,
      viewState: PropTypes.object.isRequired,
      minimumLargeScreenWidth: PropTypes.number,
      version: PropTypes.string,
      children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element
      ]),
      t: PropTypes.func.isRequired
    },

    getDefaultProps() {
      return { minimumLargeScreenWidth: 768 };
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
      const { t } = this.props;
      const that = this;
      // only need to know on initial load
      this.dragOverListener = e => {
        if (
          !e.dataTransfer.types ||
          !arrayContains(e.dataTransfer.types, "Files")
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        that.acceptDragDropFile();
      };

      this.resizeListener = () => {
        runInAction(() => {
          this.props.viewState.useSmallScreenInterface = this.shouldUseMobileInterface();
        });
      };

      window.addEventListener("resize", this.resizeListener, false);

      this.resizeListener();

      if (
        this.props.terria.configParameters.storyEnabled &&
        this.props.terria.stories &&
        this.props.terria.stories.length &&
        !this.props.viewState.storyShown
      ) {
        this.props.viewState.notifications.push({
          title: t("sui.notifications.title"),
          message: t("sui.notifications.message"),
          confirmText: t("sui.notifications.confirmText"),
          denyText: t("sui.notifications.denyText"),
          confirmAction: action(() => {
            this.props.viewState.storyShown = true;
          }),
          denyAction: action(() => {
            this.props.viewState.storyShown = false;
          }),
          type: "story",
          width: 300
        });
      }
    },

    componentDidMount() {
      this._wrapper.addEventListener("dragover", this.dragOverListener, false);
      showStoryPrompt(this.props.viewState, this.props.terria);
    },

    componentWillUnmount() {
      window.removeEventListener("resize", this.resizeListener, false);
      document.removeEventListener("dragover", this.dragOverListener, false);
    },

    acceptDragDropFile() {
      runInAction(() => {
        this.props.viewState.isDraggingDroppingFile = true;
      });
      // if explorer window is already open, we open my data tab
      if (this.props.viewState.explorerPanelIsVisible) {
        this.props.viewState.openUserData();
      }
    },

    shouldUseMobileInterface() {
      return document.body.clientWidth < this.props.minimumLargeScreenWidth;
    },

    render() {
      const { t } = this.props;
      const mergedTheme = combine(this.props.themeOverrides, terriaTheme, true);
      const theme = mergedTheme;

      const customElements = processCustomElements(
        this.props.viewState.useSmallScreenInterface,
        this.props.children
      );

      const terria = this.props.terria;
      const allBaseMaps = this.props.allBaseMaps;

      const showStoryBuilder =
        this.props.viewState.storyBuilderShown &&
        !this.shouldUseMobileInterface();
      const showStoryPanel =
        this.props.terria.configParameters.storyEnabled &&
        this.props.terria.stories.length &&
        this.props.viewState.storyShown &&
        !this.props.viewState.explorerPanelIsVisible &&
        !this.props.viewState.storyBuilderShown;
      return (
        <ThemeProvider theme={mergedTheme}>
          <GlobalTerriaStyles
            experimentalFeatures={
              this.props.terria.configParameters.experimentalFeatures
            }
          />
          <TourPortal terria={terria} viewState={this.props.viewState} />
          <SatelliteHelpPrompt
            terria={terria}
            viewState={this.props.viewState}
          />
          <Helmet>
            <title>{this.props.terria.appName}</title>
            <meta name="description" content="A web map built on Terria Map" />
          </Helmet>
          <RoutingListener viewState={this.props.viewState} />
          <div className={Styles.storyWrapper}>
            <If condition={!this.props.viewState.disclaimerVisible}>
              <WelcomeMessage viewState={this.props.viewState} />
            </If>

            <div
              className={classNames(Styles.uiRoot, {
                [Styles.withStoryBuilder]: showStoryBuilder
              })}
              css={`
                ${this.props.viewState.disclaimerVisible &&
                  `filter: blur(10px);`}
              `}
              ref={w => (this._wrapper = w)}
            >
              <div
                className={Styles.ui}
                css={`
                  background: ${theme.dark};
                `}
              >
                <div className={Styles.uiInner}>
                  <If condition={!this.props.viewState.hideMapUi()}>
                    <Small>
                      <MobileHeader
                        terria={terria}
                        menuItems={customElements.menu}
                        menuLeftItems={customElements.menuLeft}
                        viewState={this.props.viewState}
                        version={this.props.version}
                        allBaseMaps={allBaseMaps}
                      />
                    </Small>
                    <Medium>
                      <div
                        className={classNames(
                          Styles.sidePanel,
                          this.props.viewState.topElement === "SidePanel"
                            ? "top-element"
                            : "",
                          {
                            [Styles.sidePanelHide]: this.props.viewState
                              .isMapFullScreen
                          }
                        )}
                        tabIndex={0}
                        onClick={action(() => {
                          this.props.viewState.topElement = "SidePanel";
                        })}
                        // TODO: debounce/batch
                        onTransitionEnd={() =>
                          this.props.viewState.triggerResizeEvent()
                        }
                      >
                        <Branding
                          terria={terria}
                          version={this.props.version}
                        />
                        <SidePanel
                          terria={terria}
                          viewState={this.props.viewState}
                        />
                      </div>
                    </Medium>
                  </If>
                  <Medium>
                    <div
                      className={classNames(Styles.showWorkbenchButton, {
                        [Styles.showWorkbenchButtonTrainerBarVisible]: this
                          .props.viewState.trainerBarVisible,
                        [Styles.showWorkbenchButtonisVisible]: this.props
                          .viewState.isMapFullScreen,
                        [Styles.showWorkbenchButtonisNotVisible]: !this.props
                          .viewState.isMapFullScreen
                      })}
                    >
                      <FullScreenButton
                        terria={this.props.terria}
                        viewState={this.props.viewState}
                        minified={false}
                        btnText={t("sui.showWorkbench")}
                        animationDuration={animationDuration}
                      />
                    </div>
                  </Medium>

                  <section className={Styles.map}>
                    <ProgressBar terria={terria} />
                    <MapColumn
                      terria={terria}
                      viewState={this.props.viewState}
                      customFeedbacks={customElements.feedback}
                      customElements={customElements}
                      allBaseMaps={allBaseMaps}
                      animationDuration={animationDuration}
                    />
                    <main>
                      <Route
                        path={[CATALOG_MEMBER_ROUTE, CATALOG_ROUTE, "*"]}
                        render={() => (
                          <ExplorerWindow
                            terria={terria}
                            viewState={this.props.viewState}
                          />
                        )}
                      />
                      <If
                        condition={
                          this.props.terria.configParameters
                            .experimentalFeatures &&
                          !this.props.viewState.hideMapUi()
                        }
                      >
                        <ExperimentalFeatures
                          terria={terria}
                          viewState={this.props.viewState}
                          experimentalItems={customElements.experimentalMenu}
                        />
                      </If>
                    </main>
                  </section>
                </div>
              </div>

              <If condition={!this.props.viewState.hideMapUi()}>
                <Medium>
                  <TrainerBar
                    terria={terria}
                    viewState={this.props.viewState}
                  />
                </Medium>
              </If>

              <Medium>
                {/* I think this does what the previous boolean condition does, but without the console error */}
                <If condition={this.props.viewState.isToolOpen}>
                  <Tool
                    viewState={this.props.viewState}
                    {...this.props.viewState.currentTool}
                  />
                </If>
              </Medium>

              <Notification viewState={this.props.viewState} />
              <MapInteractionWindow
                terria={terria}
                viewState={this.props.viewState}
              />

              <If
                condition={
                  !customElements.feedback.length &&
                  this.props.terria.configParameters.feedbackUrl &&
                  !this.props.viewState.hideMapUi()
                }
              >
                <aside className={Styles.feedback}>
                  <FeedbackForm viewState={this.props.viewState} />
                </aside>
              </If>

              <div
                className={classNames(
                  Styles.featureInfo,
                  this.props.viewState.topElement === "FeatureInfo"
                    ? "top-element"
                    : "",
                  {
                    [Styles.featureInfoFullScreen]: this.props.viewState
                      .isMapFullScreen
                  }
                )}
                tabIndex={0}
                onClick={action(() => {
                  this.props.viewState.topElement = "FeatureInfo";
                })}
              >
                <FeatureInfoPanel
                  terria={terria}
                  viewState={this.props.viewState}
                />
              </div>
              <DragDropFile
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
              <DragDropNotification viewState={this.props.viewState} />
              {showStoryPanel && (
                <StoryPanel terria={terria} viewState={this.props.viewState} />
              )}
            </div>
            {this.props.terria.configParameters.storyEnabled &&
              showStoryBuilder && (
                <StoryBuilder
                  isVisible={showStoryBuilder}
                  terria={terria}
                  viewState={this.props.viewState}
                  animationDuration={animationDuration}
                />
              )}
            <HelpPanel terria={terria} viewState={this.props.viewState} />
            <Disclaimer viewState={this.props.viewState} />
          </div>
        </ThemeProvider>
      );
    }
  })
);

const StandardUserInterfaceWithRouter = withRouter(
  withRoutingTracker(withTranslation()(StandardUserInterfaceRaw))
);

export const StandardUserInterface = props => (
  <Router>
    <StandardUserInterfaceWithRouter {...props} />
  </Router>
);

export default withFallback(withTranslation()(StandardUserInterface));
