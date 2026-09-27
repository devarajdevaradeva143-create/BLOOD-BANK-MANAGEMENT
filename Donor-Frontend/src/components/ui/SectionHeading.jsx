export default function SectionHeading({
  title,
  subtitle,
  centered = false,
  className = "",
}) {
  return (
    <div className={`mb-10 ${centered ? "text-center" : ""} ${className}`}>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-base leading-relaxed text-gray-600 dark:text-slate-400 ${
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          }`}
        >
          {subtitle}
        </p>
      )}
      <div
        className={`mt-4 h-1 w-12 rounded-full bg-red-600 dark:bg-brand-500 ${
          centered ? "mx-auto" : ""
        }`}
      />
    </div>
  );
}
