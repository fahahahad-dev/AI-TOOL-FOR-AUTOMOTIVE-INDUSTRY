export const FeatureCard = (props: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-5 shadow-md hover:shadow-lg transition-shadow">
    <div className="size-12 rounded-lg bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-400 p-2 flex items-center justify-center [&_svg]:stroke-white [&_svg]:stroke-2">
      {props.icon}
    </div>

    <div className="mt-2 text-lg font-bold text-blue-700">{props.title}</div>

    <div className="my-3 w-8 border-t border-cyan-400" />

    <div className="mt-2 text-gray-700">{props.children}</div>
  </div>
);
