import React, { useEffect, useState, useCallback } from "react";
import ConnectionsListProfiles from "./ConnectionsListProfiles";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import * as sdk from "../services/sdk";
import { FeedItem, Graph, HexString, Profile } from "../utilities/types";
import { upsertProfile } from "../redux/slices/profileSlice";
import { ActivityContentNote } from "@dsnp/sdk/core/activityContent";

enum ListStatus {
  CLOSED,
  FOLLOWERS,
  FOLLOWING,
}

const ConnectionsList = (): JSX.Element => {
  const profile: Profile | undefined = useAppSelector(
    (state) => state.user.profile
  );
  const graphs: Graph[] = useAppSelector((state) => state.graphs.graphs);
  const graph: Graph | undefined = graphs.find(
    ({ socialAddress }) => socialAddress === profile?.socialAddress
  );
  const feed: FeedItem<ActivityContentNote>[] = useAppSelector(
    (state) => state.feed.feed
  );
  const myPostsCount = feed.filter(
    (feedItem) =>
      feedItem.fromAddress === profile?.socialAddress &&
      feedItem.inReplyTo === null
  ).length;

  const cachedProfiles: Record<HexString, Profile> = useAppSelector(
    (state) => state.profiles.profiles
  );
  const [selectedListTitle, setSelectedListTitle] = useState<ListStatus>(
    ListStatus.CLOSED
  );
  const [selectedList, setSelectedList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [notFollowingList, setNotFollowingList] = useState<Profile[]>([]);
  const dispatch = useAppDispatch();

  const getConnectionProfile = async (
    socialAddress: HexString
  ): Promise<Profile> => {
    let userProfile = cachedProfiles[socialAddress];
    if (!userProfile) {
      userProfile = await sdk.getProfile(socialAddress);
      stableDispatch(upsertProfile(userProfile));
    }
    return userProfile;
  };

  const getUserConnectionsList = async (
    following: HexString[],
    followers: HexString[]
  ) => {
    const followingProfiles: Profile[] = await Promise.all(
      (following || []).map((socialAddress: string) =>
        stableGetConnectionProfile(socialAddress)
      )
    );
    const followersProfiles: Profile[] = await Promise.all(
      (followers || []).map((socialAddress: string) =>
        stableGetConnectionProfile(socialAddress)
      )
    );
    return [followingProfiles, followersProfiles];
  };

  const getNotFollowingProfiles = (
    followingProfiles: Profile[],
    followersProfiles: Profile[]
  ) => {
    return followersProfiles.filter((userProfile) => {
      return !followingProfiles.find(
        (followingProfile) =>
          followingProfile.socialAddress === userProfile.socialAddress
      );
    });
  };

  const stableDispatch = useCallback(dispatch, [dispatch]);

  const stableGetConnectionProfile = useCallback(getConnectionProfile, [
    cachedProfiles,
    stableDispatch,
  ]);

  const stableGetUserConnectionsList = useCallback(getUserConnectionsList, [
    stableGetConnectionProfile,
  ]);

  useEffect(() => {
    if (!graph) return;
    stableGetUserConnectionsList(graph.following, graph.followers).then(
      (userRelationships) => {
        const [followingProfiles, followersProfiles] = userRelationships;
        setFollowingList(followingProfiles);
        setFollowersList(followersProfiles);
        setNotFollowingList(
          getNotFollowingProfiles(followingProfiles, followersProfiles)
        );
      }
    );
  }, [stableGetUserConnectionsList, graph]);

  useEffect(() => {
    if (selectedListTitle === ListStatus.FOLLOWING) {
      setSelectedList(followingList);
    } else if (selectedListTitle === ListStatus.FOLLOWERS) {
      setSelectedList(followersList);
    } else setSelectedList([]);
  }, [selectedListTitle, followersList, followingList]);

  const handleClick = (listTitle: ListStatus) => {
    if (selectedListTitle === listTitle)
      setSelectedListTitle(ListStatus.CLOSED);
    else {
      setSelectedListTitle(listTitle);
    }
  };

  const getClassName = (name: ListStatus) => {
    return selectedListTitle === name
      ? "ConnectionsList__button ConnectionsList__button--active"
      : "ConnectionsList__button";
  };

  return (
    <div className="ConnectionsList__block">
      <div className="ConnectionsList__buttonBlock">
        <button className="ConnectionsList__button">
          <div className="ConnectionsList__buttonCount">{myPostsCount}</div>
          Posts
        </button>
        <button
          className={getClassName(ListStatus.FOLLOWERS)}
          onClick={() => handleClick(ListStatus.FOLLOWERS)}
        >
          <div className="ConnectionsList__buttonCount">
            {graph?.followers.length}
          </div>
          Followers
        </button>
        <button
          className={getClassName(ListStatus.FOLLOWING)}
          onClick={() => handleClick(ListStatus.FOLLOWING)}
        >
          <div className="ConnectionsList__buttonCount">
            {graph?.following.length}
          </div>
          Following
        </button>
      </div>
      <ConnectionsListProfiles
        listStatus={selectedListTitle}
        connectionsList={selectedList}
        notFollowingList={notFollowingList}
      />
    </div>
  );
};

export default ConnectionsList;
