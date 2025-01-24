import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

// Just re-export for now
// We may want to customize this component in the future
// But at least this way we can use the same import.
//
// For instance one future improvement would be to synchronize the animation
// across all instances displayed at the same time.
// Right now if the components are not rendered at the same time, you'll see the animation
// be at a different progress for each one.
//
// Important: The children of the component are used as a mask and SkeletonPlaceholder
// tries to determine the width / height of the leaf nodes and use a solid background for them.
// So don't be surprised if it doesn't behave like standard React Native styles.
// You may need to provide explicit width / height props to the leaf nodes to get the desired effect.
// See https://github.com/chramos/react-native-skeleton-placeholder/blob/3c0ebcf3f99f9f0d0708c12f7f8e7fdc8bac843c/src/skeleton-placeholder.tsx#L166
export default SkeletonPlaceholder
