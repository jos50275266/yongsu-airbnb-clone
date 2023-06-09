"use client";

import { useMemo, useState } from "react";

import useRentModal from "@/app/hooks/useRentModal";
import Modal from "./Modal";
import Heading from "../Heading";
import { categories } from "../navbar/Categories";
import CategoryInput from "../inputs/CategoryInput";
import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import CountrySelect from "../inputs/CountrySelect";
import dynamic from "next/dynamic";
import Counter from "../inputs/Counter";
import ImageUpload from "../inputs/ImageUpload";
import Input from "../inputs/Input";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

// 순서대로 선택 할 요소를 만들어야하기 때문에
enum STEPS {
  CATEGORY = 0,
  LOCATION = 1,
  INFO = 2,
  IMAGES = 3,
  DESCRIPTION = 4,
  PRICE = 5,
}

const RentModal = () => {
  const router = useRouter();
  const rentModal = useRentModal();

  // 0번 CATEGORY가 기본 값
  const [step, setStep] = useState(STEPS.CATEGORY);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FieldValues>({
    defaultValues: {
      category: "",
      location: null,
      guestCount: 1,
      roomCount: 1,
      bathroomCount: 1,
      imageSrc: "",
      price: 1,
      title: "",
      description: "",
    },
  });

  // Watch and subscribe to the entire form update/change based on onChange and re-render at the useForm.
  const category = watch("category");
  const location = watch("location");
  const guestCount = watch("guestCount");
  const roomCount = watch("roomCount");
  const bathroomCount = watch("bathroomCount");
  const imageSrc = watch("imageSrc");

  // Map 컴포넌트가 불러지는 데 시간이 걸리기 때문에
  const Map = useMemo(
    () => dynamic(() => import("../Map"), { ssr: false }),
    [location]
  );

  // setValue (react-hook-form)은 재렌더링하지 않는다
  const setCustomValue = (id: string, value: any) => {
    setValue(id, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onBack = () => {
    setStep((value) => value - 1);
  };

  const onNext = () => {
    setStep((value) => value + 1);
  };

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    // 현재 마지막 단계인지 검토
    if (step !== STEPS.PRICE) {
      return onNext();
    }

    setIsLoading(true);

    axios
      .post("/api/listings", data)
      .then(() => {
        toast.success("Listing Created");
        router.refresh();
        reset();
        setStep(STEPS.CATEGORY);
        rentModal.onClose();
      })
      .catch(() => {
        toast.error("Something went wrong");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const actionLabel = useMemo(() => {
    // Price가 마지막이기 때문에
    if (step === STEPS.PRICE) {
      return "CREATE";
    }

    return "Next";
  }, [step]);

  const secondaryActionLabel = useMemo(() => {
    // 0번일때는 뒤가 없기 때문에
    if (step === STEPS.CATEGORY) {
      return undefined;
    }

    return "BACK";
  }, [step]);

  // 변경 될 예정이기 때문에 let으로 정의
  let bodyContent = (
    <div className="flex flex-col gap-8">
      <Heading
        title="Which os these best describes your place?"
        subtitle="Pick a category"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
        {categories.map((item) => (
          <div key={item.label} className="col-span-1">
            <CategoryInput
              onClick={(category) => setCustomValue("category", category)}
              selected={category === item.label}
              label={item.label}
              icon={item.icon}
            />
          </div>
        ))}
      </div>
    </div>
  );

  if (step === STEPS.LOCATION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Where is your place location?"
          subtitle="Help guests find you!"
        />
        <CountrySelect
          value={location}
          onChange={(value) => setCustomValue("location", value)}
        />
        <Map center={location?.latlng} />
      </div>
    );
  }

  if (step === STEPS.INFO) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Share some basics about your place"
          subtitle="What amenities do you have?"
        />
        <Counter
          title="Number of guests"
          subtitle="How many guests"
          value={guestCount}
          onChange={(value) => setCustomValue("guestCount", value)}
        />
        <hr />
        <Counter
          title="Rooms"
          subtitle="How many rooms do you have"
          value={roomCount}
          onChange={(value) => setCustomValue("roomCount", value)}
        />
        <hr />
        <Counter
          title="Bathrooms"
          subtitle="How many bathrooms do you have"
          value={bathroomCount}
          onChange={(value) => setCustomValue("bathroomCount", value)}
        />
      </div>
    );
  }

  if (step === STEPS.IMAGES) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Add a photo of your place"
          subtitle="Show guests what your place looks lie!"
        />
        <ImageUpload
          value={imageSrc}
          onChange={(value) => setCustomValue("imageSrc", value)}
        />
      </div>
    );
  }

  if (step === STEPS.DESCRIPTION) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="How would you describe your place?"
          subtitle="Short and sweet works best!"
        />
        <Input
          id="title"
          label="Title"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <hr />
        <Input
          id="description"
          label="Description"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );
  }

  if (step === STEPS.PRICE) {
    bodyContent = (
      <div className="flex flex-col gap-8">
        <Heading
          title="Now, set your price"
          subtitle="How much do you charge per night?"
        />
        <Input
          id="price"
          label="Price"
          formatPrice={true}
          type="number"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );
  }

  return (
    <Modal
      isOpen={rentModal.isOpen}
      onClose={rentModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      actionLabel={actionLabel}
      secondaryActionLabel={secondaryActionLabel}
      secondaryAction={step === STEPS.CATEGORY ? undefined : onBack}
      title="Airbnb your home!"
      body={bodyContent}
    />
  );
};

export default RentModal;

// setValue 함수에 전달되는 세 번째 매개변수는 객체 형태로 작성되어 있으며, 다음과 같은 속성을 가집니다:

// shouldValidate: 값이 설정된 후에 유효성을 검사해야하는지 여부를 나타내는 불리언 값입니다. 일반적으로 폼 유효성 검사를 수행하는 라이브러리에서 사용됩니다. 이 값이 true로 설정되면, setValue 함수는 값이 변경된 후에 유효성 검사를 수행합니다.
// shouldDirty: 값이 변경되었음을 나타내는 불리언 값입니다. 마찬가지로 폼 라이브러리에서 사용되며, true로 설정되면 해당 필드가 "더티(dirty)" 상태로 표시됩니다. 이는 사용자가 해당 필드를 수정했음을 나타냅니다.
// shouldTouch: 사용자가 필드에 대해 상호 작용했는지 여부를 나타내는 불리언 값입니다. true로 설정되면 해당 필드가 "터치(touch)" 상태로 표시됩니다. 이는 사용자가 해당 필드에 대해 포커스를 가져와서 입력을 시작했음을 나타냅니다.
// 따라서 setCustomValue 함수를 호출하면 setValue 함수가 호출되어 주어진 id와 value로 값을 설정하고, 해당 필드를 유효성 검사, 더티 상태로 표시하고, 터치 상태로 표시합니다.

// dynamic(() => import("../Map"), { ssr: false }) 코드는 코드 스플리팅(Code Splitting)을 위해 사용됩니다.
// 일반적으로 React 애플리케이션은 모든 컴포넌트를 처음에 한 번에 불러와서 렌더링합니다. 하지만 애플리케이션 규모가 커지고 컴포넌트의 수가 많아지면 초기 로딩 시간이 길어질 수 있습니다.
// 코드 스플리팅은 애플리케이션을 여러 개의 작은 번들(chunk)로 분할하여 필요한 컴포넌트만 필요한 시점에 동적으로 불러오는 기술입니다. 이를 통해 초기 로딩 시간을 줄이고, 필요하지 않은 컴포넌트의 로드를 지연시킬 수 있습니다.
// dynamic(() => import("../Map"), { ssr: false }) 코드는 Next.js에서 제공하는 dynamic 함수를 사용하여 Map 컴포넌트를 동적으로 불러옵니다. import("../Map")는 Map 컴포넌트를 동적으로 불러오는 함수입니다. { ssr: false }는 서버 사이드 렌더링(SSR)을 사용하지 않도록 설정하는 옵션입니다.
// 이를 통해 Map 컴포넌트는 초기 로딩 시에는 포함되지 않고, 해당 컴포넌트가 필요한 시점에 비동기적으로 불러와집니다. 이는 애플리케이션의 성능을 향상시키고 초기 로딩 시간을 줄여줄 수 있습니다.
