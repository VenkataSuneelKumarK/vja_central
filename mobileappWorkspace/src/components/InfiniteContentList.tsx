import { ReactElement } from "react";
import { FlatList, RefreshControl, ActivityIndicator, View, ScrollView } from "react-native";
import { useContentList, flattenPages } from "@/api/hooks/useContentList";
import { EmptyState, ErrorState, SkeletonList } from "@/components/States";
import { spacing } from "@/theme/colors";

// Backs Activities, News, Announcements and Videos list screens — one
// infinite-scroll + pull-to-refresh + skeleton/empty/error implementation
// instead of four near-identical FlatLists (§19 of the brief: pagination,
// infinite scrolling, skeleton loaders; §34: never a raw blank screen).
export function InfiniteContentList<T extends { _id: string }>({
  path,
  params,
  queryKey,
  renderItem,
  emptyLabel,
  numColumns = 1,
}: {
  path: string;
  params?: Record<string, unknown>;
  queryKey?: unknown[];
  renderItem: (item: T) => ReactElement;
  emptyLabel: string;
  numColumns?: number;
}) {
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useContentList<T>(
    path,
    params,
    queryKey
  );

  const items = flattenPages(data?.pages);

  if (isLoading) return <SkeletonList />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (items.length === 0) {
    // Still wrapped in a pull-to-refreshable scroll view — an empty filter
    // (e.g. "Completed" with nothing completed yet) shouldn't leave the
    // user with no way to pull down and check again.
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <EmptyState title={emptyLabel} />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => renderItem(item)}
      numColumns={numColumns}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
      columnWrapperStyle={numColumns > 1 ? { gap: spacing.md } : undefined}
      ItemSeparatorComponent={numColumns === 1 ? () => <View style={{ height: spacing.md }} /> : undefined}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ marginVertical: spacing.lg }} /> : null}
    />
  );
}
